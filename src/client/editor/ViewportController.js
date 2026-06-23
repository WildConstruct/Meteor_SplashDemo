// ViewportController — maps between image UV (0..1), screen pixels (the SVG
// overlay), and surface UV (via a surface homography). The VFX result is rendered
// by WebGPU filling the canvas; the SVG overlay sits on top at the same rect, so
// image UV maps linearly to the overlay's client box (build plan §7.2, §11).

import { applyHomography, computeHomography } from '../../engine/geometry/Homography.js';

export class ViewportController {
  constructor(svg) {
    this.svg = svg;
    this.homographies = new Map(); // surfaceId -> {forward, inverse}
  }

  size() {
    const r = this.svg.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }

  /** image UV (0..1) -> overlay pixel */
  uvToScreen(u, v) {
    const { w, h } = this.size();
    return { x: u * w, y: v * h };
  }

  /** overlay pixel (relative to svg) -> image UV */
  screenToUv(px, py) {
    const { w, h } = this.size();
    return { u: px / w, v: py / h };
  }

  /** pointer event -> image UV */
  eventToUv(e) {
    const { left, top } = this.size();
    return this.screenToUv(e.clientX - left, e.clientY - top);
  }

  cacheHomography(surface) {
    const quad = (surface.calibrationQuad || []).map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
    this.homographies.set(surface.id, computeHomography(quad));
  }

  surfaceUVToImage(surfaceId, u, v) {
    const h = this.homographies.get(surfaceId);
    if (!h?.forward) return [u, v];
    return applyHomography(h.forward, u, v);
  }

  imageToSurfaceUV(surfaceId, x, y) {
    const h = this.homographies.get(surfaceId);
    if (!h?.inverse) return [x, y];
    return applyHomography(h.inverse, x, y);
  }

  surfaceUVToScreen(surfaceId, u, v) {
    const [ix, iy] = this.surfaceUVToImage(surfaceId, u, v);
    return this.uvToScreen(ix, iy);
  }
}

// small SVG helpers
export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}
