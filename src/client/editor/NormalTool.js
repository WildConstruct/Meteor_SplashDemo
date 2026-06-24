// NormalTool — a 3-axis (X/Y/Z) gizmo for the surface's WORLD normal (the
// orientation of the ground plane in 3D). The normal drives the splash lift and
// aims the spherical sky reflection. Each axis has a draggable handle constrained
// to slide along that axis (projected to screen); dragging sets that component of
// the normal. Stored raw on surface.worldNormal; the engine normalizes for use.

import { svgEl } from './ViewportController.js';
import { surfaceWorldNormal } from '../../engine/geometry/SurfaceTransforms.js';

// Fixed pseudo-3D screen basis: world X -> right, Y -> up, Z (toward camera) ->
// down-right diagonal so depth reads. Shared by the renderer AND the drag math.
export const GIZMO_BASIS = {
  x: { x: 1, y: 0 },
  y: { x: 0, y: -1 },
  z: { x: 0.52, y: 0.34 },
};
export const GIZMO_R = 70;
const AXIS_COLOR = { x: '#ff6b6b', y: '#67e87f', z: '#5cc8ff' };

/** Raw editable normal (defaults to the derived/normalized one if unset). */
export function normalForGizmo(surface) {
  return surface.worldNormal ?? surfaceWorldNormal(surface);
}

function project(center, v) {
  const b = GIZMO_BASIS;
  return {
    x: center.x + (v.x * b.x.x + v.y * b.y.x + v.z * b.z.x) * GIZMO_R,
    y: center.y + (v.x * b.x.y + v.y * b.y.y + v.z * b.z.y) * GIZMO_R,
  };
}

export function renderNormal(group, vp, surface, selected) {
  if (!selected) return;
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  const n = normalForGizmo(surface);

  // faint full-length axis guides (+/-) for reference
  for (const k of ['x', 'y', 'z']) {
    const u = { x: 0, y: 0, z: 0 }; u[k] = 1;
    const pPos = project(center, u);
    const neg = { x: -u.x, y: -u.y, z: -u.z };
    const pNeg = project(center, neg);
    group.appendChild(svgEl('line', { x1: pNeg.x, y1: pNeg.y, x2: pPos.x, y2: pPos.y, class: 'gizmo-axis', stroke: AXIS_COLOR[k] }));
    const lbl = svgEl('text', { x: pPos.x + 4, y: pPos.y - 4, class: 'gizmo-axis-label', fill: AXIS_COLOR[k] });
    lbl.textContent = k.toUpperCase();
    group.appendChild(lbl);
  }

  // resultant normal arrow
  const tip = project(center, n);
  group.appendChild(svgEl('line', { x1: center.x, y1: center.y, x2: tip.x, y2: tip.y, class: 'gizmo-normal' }));
  group.appendChild(svgEl('circle', { cx: center.x, cy: center.y, r: 3, class: 'gizmo-origin' }));

  // per-axis draggable handles at the component positions
  for (const k of ['x', 'y', 'z']) {
    const v = { x: 0, y: 0, z: 0 }; v[k] = n[k];
    const p = project(center, v);
    group.appendChild(svgEl('circle', {
      cx: p.x, cy: p.y, r: 7, class: 'handle gizmo-handle',
      fill: AXIS_COLOR[k], 'data-handle': `normal-${k}`, 'data-surface': surface.id,
    }));
  }
}

/**
 * Set one component of a surface's world normal from a dragged screen point.
 * Inverts the gizmo projection: n[axis] = (P-center)·axisVec / (R·|axisVec|²).
 */
export function normalAxisFromDrag(vp, surface, axis, screenPt) {
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  const a = GIZMO_BASIS[axis];
  const dx = screenPt.x - center.x;
  const dy = screenPt.y - center.y;
  const denom = (a.x * a.x + a.y * a.y) * GIZMO_R || 1;
  const value = (dx * a.x + dy * a.y) / denom;
  const cur = { ...normalForGizmo(surface) };
  cur[axis] = Math.max(-1.5, Math.min(1.5, value));
  return cur; // raw (not normalized); engine normalizes on use
}
