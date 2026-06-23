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
 * A 1.5-texel soft edge is applied so the mask reads cleanly when sampled.
 * @param {Array<{u:number,v:number}>} poly
 */
export function rasterizeMask(poly, width, height) {
  const data = new Uint8Array(width * height);
  if (!poly || poly.length < 3) return data; // empty mask
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      data[y * width + x] = pointInPolygon(u, v, poly) ? 255 : 0;
    }
  }
  return softenEdges(data, width, height);
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
