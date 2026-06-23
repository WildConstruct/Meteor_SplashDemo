// NormalTool — the art-directed splash normal handle (build plan §12.3). Drawn
// from the surface centre; dragging sets normalDirection (angle) and normalScale
// (length). Deliberately NOT locked to the calibration quad.

import { svgEl } from './ViewportController.js';

export function renderNormal(group, vp, surface, selected) {
  if (!selected) return;
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  const angle = surface.normalDirection ?? -1.5708;
  const scale = surface.normalScale ?? 0.04;
  const len = 40 + scale * 600;
  const tip = { x: center.x + Math.cos(angle) * len, y: center.y + Math.sin(angle) * len };

  group.appendChild(svgEl('line', {
    x1: center.x, y1: center.y, x2: tip.x, y2: tip.y, class: 'normal-line',
  }));
  group.appendChild(svgEl('circle', {
    cx: tip.x, cy: tip.y, r: 7, class: 'handle normal-handle',
    'data-handle': 'normal', 'data-surface': surface.id,
  }));
  const t = svgEl('text', { x: tip.x + 9, y: tip.y, class: 'handle-label' });
  t.textContent = 'N';
  group.appendChild(t);
}

/** Convert a dragged tip (screen) into normalDirection + normalScale. */
export function normalFromDrag(vp, surface, tipScreen) {
  const center = vp.surfaceUVToScreen(surface.id, 0.5, 0.5);
  const dx = tipScreen.x - center.x;
  const dy = tipScreen.y - center.y;
  const angle = Math.atan2(dy, dx);
  const len = Math.hypot(dx, dy);
  const scale = Math.max(0.005, (len - 40) / 600);
  return { normalDirection: angle, normalScale: scale };
}
