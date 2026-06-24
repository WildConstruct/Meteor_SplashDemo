// Rasterize a closed polygon (surface UV) into a single-channel mask
// (build plan §12.1, §17). Output is a Uint8Array suitable for an r8unorm
// texture upload. Pure CPU; the client uploads the result.

/** Even-odd point-in-polygon test in normalized [0,1] coords. */
export function pointInPolygon(u, v, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ui = poly[i].u ?? poly[i][0];
    const vi = poly[i].v ?? poly[i][1];
    const uj = poly[j].u ?? poly[j][0];
    const vj = poly[j].v ?? poly[j][1];
    const intersects = vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Rasterize polygon to an r8unorm-ready Uint8Array of size width*height.
 * @param {Array<{u:number,v:number}>} poly  include polygon (surface UV)
 * @param {object} [opts]
 * @param {number} [opts.feather=0]   edge softness 0..1; 0 keeps a crisp 1px AA,
 *                                    1 fades over ~6% of the texture.
 * @param {Array<Array<{u:number,v:number}>>} [opts.cutouts]  polygons subtracted
 *                                    from the mask (carve around objects).
 */
export function rasterizeMask(poly, width, height, opts = {}) {
  const { feather = 0, cutouts = [] } = opts;
  const data = new Uint8Array(width * height);
  if (!poly || poly.length < 3) return data; // empty mask
  const holes = (cutouts || []).filter((c) => c && c.length >= 3);
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      let inside = pointInPolygon(u, v, poly);
      if (inside) {
        for (let c = 0; c < holes.length; c++) {
          if (pointInPolygon(u, v, holes[c])) { inside = false; break; }
        }
      }
      data[y * width + x] = inside ? 255 : 0;
    }
  }
  // Feather radius in texels. 0 -> the existing crisp 1px soften; higher values
  // run a separable box blur so the wet plane fades softly at its edges (and
  // around cutouts). Capped relative to the texture so it stays cheap.
  const radius = Math.round(Math.max(0, Math.min(1, feather)) * Math.min(width, height) * 0.06);
  return radius > 0 ? featherMask(data, width, height, radius) : softenEdges(data, width, height);
}

/** Separable box blur of the given texel radius — an adjustable edge feather. */
function featherMask(src, w, h, r) {
  const win = 2 * r + 1;
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = 0; x <= r && x < w; x++) sum += src[row + x];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / win; // out-of-bounds samples count as 0 (edges fade)
      const add = x + r + 1;
      const sub = x - r;
      if (add < w) sum += src[row + add];
      if (sub >= 0) sum -= src[row + sub];
    }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y <= r && y < h; y++) sum += tmp[y * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(Math.min(255, sum / win));
      const add = y + r + 1;
      const sub = y - r;
      if (add < h) sum += tmp[add * w + x];
      if (sub >= 0) sum -= tmp[sub * w + x];
    }
  }
  return out;
}

/** Simple 3x3 box blur so the binary mask has a 1px feather. */
function softenEdges(src, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += src[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = Math.round(sum / n);
    }
  }
  return out;
}
