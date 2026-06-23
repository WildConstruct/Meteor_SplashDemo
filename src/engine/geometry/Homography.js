// Perspective calibration: maps surface UV (the unit square) to image UV
// (a four-corner quad on the plate) and back. Computed on the CPU in double
// precision (build plan §12.2). The resulting 3x3 matrices are uploaded to the
// GPU as mat3x3 uniforms.
//
// Corner convention (surface UV -> image UV):
//   corner[0] = (0,0)  A
//   corner[1] = (1,0)  B
//   corner[2] = (1,1)  C
//   corner[3] = (0,1)  D

/**
 * @typedef {{x:number,y:number}} Pt
 * @typedef {{
 *   forward:number[], inverse:number[],
 *   valid:boolean, warnings:string[]
 * }} Homography
 */

/** Heckbert square->quad mapping. Returns a row-major 3x3 (9 numbers). */
function squareToQuad(q) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;

  let a, b, c, d, e, f, g, h;
  const eps = 1e-12;
  if (Math.abs(dx3) < eps && Math.abs(dy3) < eps) {
    // affine
    a = p1.x - p0.x;
    b = p2.x - p1.x;
    c = p0.x;
    d = p1.y - p0.y;
    e = p2.y - p1.y;
    f = p0.y;
    g = 0;
    h = 0;
  } else {
    const denom = dx1 * dy2 - dy1 * dx2;
    g = (dx3 * dy2 - dx2 * dy3) / denom;
    h = (dx1 * dy3 - dy1 * dx3) / denom;
    a = p1.x - p0.x + g * p1.x;
    b = p3.x - p0.x + h * p3.x;
    c = p0.x;
    d = p1.y - p0.y + g * p1.y;
    e = p3.y - p0.y + h * p3.y;
    f = p0.y;
  }
  // row-major: [a b c ; d e f ; g h 1]
  return [a, b, c, d, e, f, g, h, 1];
}

/** Invert a row-major 3x3. Returns null if singular. */
export function invert3x3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-14) return null;
  const inv = 1 / det;
  return [
    A * inv,
    (c * h - b * i) * inv,
    (b * f - c * e) * inv,
    B * inv,
    (a * i - c * g) * inv,
    (c * d - a * f) * inv,
    C * inv,
    (b * g - a * h) * inv,
    (a * e - b * d) * inv,
  ];
}

/** Apply a row-major 3x3 to (x,y,1) with perspective divide. */
export function applyHomography(m, x, y) {
  const X = m[0] * x + m[1] * y + m[2];
  const Y = m[3] * x + m[4] * y + m[5];
  const W = m[6] * x + m[7] * y + m[8];
  return [X / W, Y / W];
}

function cross2(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

/** True if segment p1p2 intersects p3p4 (proper intersection). */
function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = cross2(p4.x - p3.x, p4.y - p3.y, p1.x - p3.x, p1.y - p3.y);
  const d2 = cross2(p4.x - p3.x, p4.y - p3.y, p2.x - p3.x, p2.y - p3.y);
  const d3 = cross2(p2.x - p1.x, p2.y - p1.y, p3.x - p1.x, p3.y - p1.y);
  const d4 = cross2(p2.x - p1.x, p2.y - p1.y, p4.x - p1.x, p4.y - p1.y);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

/** Signed area of the quad (shoelace). Positive = CCW in math coords. */
export function quadSignedArea(q) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/**
 * Build a homography from a calibration quad (4 image-UV points).
 * @param {Pt[]} quad corners A,B,C,D
 * @returns {Homography}
 */
export function computeHomography(quad) {
  const warnings = [];
  if (!quad || quad.length !== 4) {
    return { forward: null, inverse: null, valid: false, warnings: ['quad must have 4 corners'] };
  }

  const area = quadSignedArea(quad);
  if (Math.abs(area) < 1e-6) warnings.push('near-zero quad area');
  // Image UV is y-down; a correctly wound A,B,C,D quad (clockwise on screen) has
  // POSITIVE shoelace area. Negative => corners reversed.
  if (area < 0) warnings.push('inverted winding (corners may be reversed)');

  // self-intersection (bowtie): AB×CD or BC×DA
  if (
    segmentsIntersect(quad[0], quad[1], quad[2], quad[3]) ||
    segmentsIntersect(quad[1], quad[2], quad[3], quad[0])
  ) {
    warnings.push('self-intersecting (bowtie) quad');
  }

  for (const p of quad) {
    if (p.x < -2 || p.x > 3 || p.y < -2 || p.y > 3) {
      warnings.push('extreme corner coordinate (far outside the plate)');
      break;
    }
  }

  const forward = squareToQuad(quad);
  const inverse = invert3x3(forward);
  if (!inverse) warnings.push('singular / ill-conditioned matrix');

  const valid = inverse != null &&
    !warnings.includes('self-intersecting (bowtie) quad') &&
    !warnings.includes('near-zero quad area');

  return { forward, inverse, valid, warnings };
}
