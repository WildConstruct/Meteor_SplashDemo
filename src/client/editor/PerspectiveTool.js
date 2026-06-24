// PerspectiveTool — four-corner calibration quad with draggable handles (build
// plan §12.2, Milestone 2). Corners are stored in image UV. Editing a corner
// updates the homography immediately (the overlay recomputes on redraw).

import { svgEl } from './ViewportController.js';
import { isWarped } from '../../engine/geometry/SurfaceWarp.js';

const CORNER_LABELS = ['A', 'B', 'C', 'D'];

export function renderQuad(group, vp, surface, selected) {
  if (isWarped(surface)) return; // a warped surface is drawn by WarpTool instead
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

  // edge midpoint handles — drag an edge along its normal to push that side
  // in/out (both of the edge's corners move together).
  screen.forEach((s, i) => {
    const a = screen[i], b = screen[(i + 1) % 4];
    group.appendChild(svgEl('rect', {
      x: (a.x + b.x) / 2 - 5, y: (a.y + b.y) / 2 - 5, width: 10, height: 10,
      class: 'handle edge-handle', 'data-handle': 'edge',
      'data-surface': surface.id, 'data-edge': i,
    }));
  });

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
