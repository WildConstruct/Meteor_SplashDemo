// SurfaceTool — an invisible, clickable hit region over a surface patch so people
// can click the surface to select it (they try regardless). Deliberately NOT the
// old filled mask box + grid + label — those were visual clutter. The visible
// outline is the calibration quad (PerspectiveTool); this is just the hit target.

import { svgEl } from './ViewportController.js';

export function renderSurface(group, vp, surface, selected) {
  const pts = (surface.maskPath || [])
    .map((p) => {
      const s = vp.uvToScreen(p.u ?? p[0], p.v ?? p[1]);
      return `${s.x},${s.y}`;
    })
    .join(' ');
  if (!pts) return;
  // Transparent fill + data-handle => clickable across the whole region (the
  // overlay rule makes [data-handle] elements pointer-interactive). Drawn before
  // the handles so corner/gizmo handles sit on top and still win their clicks.
  group.appendChild(svgEl('polygon', {
    points: pts,
    class: `surface-hit${selected ? ' selected' : ''}`,
    'data-handle': 'surface-select',
    'data-surface': surface.id,
  }));
}
