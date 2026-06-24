// NormalTool — a WHEEL gizmo for the surface's WORLD normal (the orientation of
// the ground plane in 3D). Instead of fiddly per-axis dots, it's a "lean disc":
// a ring with a draggable knob. The knob's offset from centre is the normal's
// in-screen lean (x right, y up); its distance is how tilted the plane is, and Z
// (toward camera / up to the sky) derives so the normal stays unit. The normal
// drives the splash lift and aims the spherical sky reflection.

import { svgEl } from './ViewportController.js';
import { surfaceWorldNormal } from '../../engine/geometry/SurfaceTransforms.js';

export const GIZMO_R = 72;

/** Raw editable normal (defaults to the derived/normalized one if unset). */
export function normalForGizmo(surface) {
  return surface.worldNormal ?? surfaceWorldNormal(surface);
}

export function renderNormal(group, vp, surface, selected) {
  if (!selected) return;
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  const n = normalForGizmo(surface);
  const len = Math.hypot(n.x, n.y, n.z) || 1;
  const nx = n.x / len; const ny = n.y / len; // world up
  // knob position: in-screen lean (world y up -> screen up = -y)
  const knob = { x: center.x + nx * GIZMO_R, y: center.y - ny * GIZMO_R };

  // whole-wheel hit target: drag anywhere in the disc to lean the normal toward
  // the pointer (big, forgiving hit area; the ring/cross visuals below are
  // pointer-events:none so they don't intercept).
  group.appendChild(svgEl('circle', {
    cx: center.x, cy: center.y, r: GIZMO_R, class: 'gizmo-hit',
    'data-handle': 'normal-disc', 'data-surface': surface.id,
  }));
  // the wheel: outer ring + inner reference ring + crosshair
  group.appendChild(svgEl('circle', { cx: center.x, cy: center.y, r: GIZMO_R, class: 'gizmo-wheel' }));
  group.appendChild(svgEl('circle', { cx: center.x, cy: center.y, r: GIZMO_R * 0.5, class: 'gizmo-wheel-inner' }));
  group.appendChild(svgEl('line', { x1: center.x - GIZMO_R, y1: center.y, x2: center.x + GIZMO_R, y2: center.y, class: 'gizmo-cross' }));
  group.appendChild(svgEl('line', { x1: center.x, y1: center.y - GIZMO_R, x2: center.x, y2: center.y + GIZMO_R, class: 'gizmo-cross' }));

  // lean arrow centre -> knob, then the draggable knob
  group.appendChild(svgEl('line', { x1: center.x, y1: center.y, x2: knob.x, y2: knob.y, class: 'gizmo-normal' }));
  group.appendChild(svgEl('circle', { cx: center.x, cy: center.y, r: 3, class: 'gizmo-origin' }));
  group.appendChild(svgEl('circle', {
    cx: knob.x, cy: knob.y, r: 9, class: 'handle gizmo-knob',
    'data-handle': 'normal-disc', 'data-surface': surface.id,
  }));
}

/**
 * Set the world normal from a dragged knob position. lean = (P-centre)/R (clamped
 * to the unit disc); z = sqrt(1 - lean^2) so the normal stays unit and points
 * toward the camera/sky (a ground normal never points away).
 */
export function normalFromDisc(vp, surface, screenPt) {
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  let lx = (screenPt.x - center.x) / GIZMO_R;
  let ly = -(screenPt.y - center.y) / GIZMO_R; // screen down -> world up
  const r = Math.hypot(lx, ly);
  if (r > 0.999) { lx = (lx / r) * 0.999; ly = (ly / r) * 0.999; }
  const z = Math.sqrt(Math.max(0.0, 1 - lx * lx - ly * ly));
  return { x: lx, y: ly, z };
}
