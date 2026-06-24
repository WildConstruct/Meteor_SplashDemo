// Surface transform helpers (build plan §11, §12). Wraps a SurfacePatch's
// calibration into ready-to-use forward/inverse homographies plus the
// art-directed normal projection used for splash lift.

import { computeHomography, applyHomography } from './Homography.js';

/**
 * Build cached transforms for a surface patch.
 * @param {object} surface SurfacePatch with calibrationQuad [{x,y}*4] (image UV)
 */
export function buildSurfaceTransforms(surface) {
  const quad = (surface.calibrationQuad || []).map((p) =>
    Array.isArray(p) ? { x: p[0], y: p[1] } : p
  );
  const h = computeHomography(quad);
  return {
    forward: h.forward, // surface UV -> image UV
    inverse: h.inverse, // image UV -> surface UV
    valid: h.valid,
    warnings: h.warnings,
    surfaceToImage: (u, v) => applyHomography(h.forward, u, v),
    imageToSurface: (x, y) => (h.inverse ? applyHomography(h.inverse, x, y) : [NaN, NaN]),
  };
}

/**
 * The surface's 3D world normal (x right, y up, z toward camera), as a unit
 * vector. Uses surface.worldNormal if present; otherwise derives one from the
 * legacy normalDirection (screen angle) so old projects keep working — the legacy
 * screen lift dir (cos,sin) maps to world (cos, -sin, ~vertical).
 */
export function surfaceWorldNormal(surface) {
  let v = surface.worldNormal;
  if (!v || (v.x === 0 && v.y === 0 && v.z === 0)) {
    const angle = surface.normalDirection ?? -1.5708;
    v = { x: Math.cos(angle), y: -Math.sin(angle), z: 0.9 };
  }
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Art-directed normal as a 2D screen-space offset direction for splash height
 * (build plan §11.4, §12.3), derived from the 3D world normal: the in-screen
 * (x, y) components scaled by normalScale (world up -> screen up, hence -y).
 */
export function normalProjection(surface) {
  const n = surfaceWorldNormal(surface);
  const scale = surface.normalScale ?? 0.04;
  return { dx: n.x * scale, dy: -n.y * scale };
}
