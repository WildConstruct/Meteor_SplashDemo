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
 * Art-directed normal as a 2D screen-space offset direction for splash height
 * (build plan §11.4, §12.3). The artist sets an angle (radians) and scale; this
 * returns the per-unit-height screen displacement in image UV.
 */
export function normalProjection(surface) {
  const angle = surface.normalDirection ?? -1.5708; // default: "up" in image space
  const scale = surface.normalScale ?? 0.04;
  return { dx: Math.cos(angle) * scale, dy: Math.sin(angle) * scale };
}
