// PerspectiveTool — four-corner calibration quad with draggable handles (build
// plan §12.2, Milestone 2). Corners are stored in image UV. Editing a corner
// updates the homography immediately (the overlay recomputes on redraw).

import { svgEl } from './ViewportController.js';

const CORNER_LABELS = ['A', 'B', 'C', 'D'];

export function renderQuad(group, vp, surface, selected) {
  const quad = (surface.calibrationQuad || []).map((p) =>
    Array.isArray(p) ? { x: p[0], y: p[1] } : p
  );
  if (quad.length !== 4) return;

  const screen = quad.map((c) => vp.uvToScreen(c.x, c.y));
  group.appendChild(svgEl('polygon', {
    points: screen.map((s) => `${s.x},${s.y}`).join(' '),
    class: `calib-quad${selected ? ' selected' : ''}`,
  }));

  if (!selected) return;
  screen.forEach((s, i) => {
    group.appendChild(svgEl('circle', {
      cx: s.x, cy: s.y, r: 7, class: 'handle corner-handle',
      'data-handle': 'quad', 'data-surface': surface.id, 'data-corner': i,
    }));
    const t = svgEl('text', { x: s.x + 9, y: s.y - 9, class: 'handle-label' });
    t.textContent = CORNER_LABELS[i];
    group.appendChild(t);
  });
}
