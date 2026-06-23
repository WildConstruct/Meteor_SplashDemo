// SurfaceTool — renders a surface patch mask outline + surface-UV grid (build
// plan §12, Milestone 2). Mask is stored in image UV; the grid is drawn by
// projecting surface-UV lines through the homography so it visibly sits on the
// hood/ground.

import { svgEl } from './ViewportController.js';

export function renderSurface(group, vp, surface, selected) {
  // mask polygon (image UV)
  const pts = (surface.maskPath || [])
    .map((p) => {
      const s = vp.uvToScreen(p.u ?? p[0], p.v ?? p[1]);
      return `${s.x},${s.y}`;
    })
    .join(' ');
  if (pts) {
    group.appendChild(svgEl('polygon', {
      points: pts,
      class: `surface-mask${selected ? ' selected' : ''}`,
    }));
  }

  // projected surface-UV grid
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    line(group, vp, surface.id, [t, 0], [t, 1]);
    line(group, vp, surface.id, [0, t], [1, t]);
  }

  // label
  const c = surface.maskPath?.[0];
  if (c) {
    const s = vp.uvToScreen(c.u ?? c[0], c.v ?? c[1]);
    const label = svgEl('text', { x: s.x + 6, y: s.y - 6, class: 'surface-label' });
    label.textContent = surface.name || surface.id;
    group.appendChild(label);
  }
}

function line(group, vp, sid, a, b) {
  const pa = vp.surfaceUVToScreen(sid, a[0], a[1]);
  const pb = vp.surfaceUVToScreen(sid, b[0], b[1]);
  group.appendChild(svgEl('line', {
    x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, class: 'surface-grid',
  }));
}
