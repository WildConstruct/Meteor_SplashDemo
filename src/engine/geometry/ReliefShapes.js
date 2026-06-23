// Relief layers: artist-authored scalar-height contributions (build plan §16).
// For a closed shape we rasterize a signed-distance-like field and apply a soft
// height profile. The result is packed into the relief texture (R=height) and
// the engine computes gradients on the GPU.
//
// Supported shapes for the demo: { type:'polygon', points:[{u,v}] } and
// { type:'ellipse', center:{u,v}, radius:{u,v}, rotation }.

import { pointInPolygon } from './SurfaceMask.js';

function signedDistancePolygon(u, v, pts) {
  // distance to nearest edge, signed by inside/outside
  let minDist = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const ax = pts[j].u, ay = pts[j].v;
    const bx = pts[i].u, by = pts[i].v;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    let t = ((u - ax) * dx + (v - ay) * dy) / len2;
    t = Math.min(1, Math.max(0, t));
    const px = ax + t * dx, py = ay + t * dy;
    const d = Math.hypot(u - px, v - py);
    if (d < minDist) minDist = d;
  }
  return pointInPolygon(u, v, pts) ? -minDist : minDist;
}

function signedDistanceEllipse(u, v, shape) {
  const c = shape.center;
  const r = shape.radius;
  const rot = shape.rotation ?? 0;
  const cos = Math.cos(-rot), sin = Math.sin(-rot);
  const lx = (u - c.u) * cos - (v - c.v) * sin;
  const ly = (u - c.u) * sin + (v - c.v) * cos;
  // approximate signed distance for an axis-aligned ellipse
  const k = Math.hypot(lx / r.u, ly / r.v);
  return (k - 1) * Math.min(r.u, r.v);
}

function signedDistance(u, v, shape) {
  if (shape.type === 'ellipse') return signedDistanceEllipse(u, v, shape);
  return signedDistancePolygon(u, v, shape.points || []);
}

/** smoothstep height profile from the signed distance and a softness band. */
function heightProfile(sd, softness, mode) {
  // sd < 0 inside. Build a 0..1 profile that is 1 inside and falls off over
  // `softness` outside the boundary.
  const t = clamp01((softness - (-sd)) / softness); // 1 deep inside -> 0 far outside
  const profile = t * t * (3 - 2 * t);
  switch (mode) {
    case 'depression':
    case 'drain':
      return -profile;
    case 'ridge':
    case 'channel':
      // thin band around the boundary
      return Math.max(0, 1 - Math.abs(sd) / softness) * (mode === 'channel' ? -1 : 1);
    case 'raised':
    default:
      return profile;
  }
}

/**
 * Accumulate relief layers into an rgba16float-ready Float32Array (height in R,
 * gradients computed later on GPU). Returns {data, width, height}.
 * @param {Array<object>} layers ReliefLayer[]
 */
export function rasterizeRelief(layers, width, height, params = {}) {
  const heightScale = params.reliefHeight ?? 1;
  const data = new Float32Array(width * height * 4);
  if (!layers || !layers.length) return { data, width, height };
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      let h = 0;
      for (const layer of layers) {
        if (layer.enabled === false) continue;
        const sd = signedDistance(u, v, layer.shape);
        const soft = Math.max(1e-3, layer.softness ?? params.reliefSoftness ?? 0.08);
        h += heightProfile(sd, soft, layer.mode) * (layer.height ?? 1);
      }
      const i = (y * width + x) * 4;
      data[i] = h * heightScale; // R = height
      // G,B reserved for gradient (GPU), A reserved
    }
  }
  return { data, width, height };
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
