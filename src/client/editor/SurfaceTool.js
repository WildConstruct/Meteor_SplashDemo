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

// Cutout polygons (carve the wet plane around objects, e.g. the car). Shown only
// while the surface is selected: a red dashed shape + a draggable handle per
// vertex. Authored in image UV, same space as the mask path.
export function renderCutouts(group, vp, surface, selected) {
  if (!selected) return;
  (surface.cutouts ?? []).forEach((cut, ci) => {
    const verts = (cut.points ?? cut);
    const screen = verts.map((p) => vp.uvToScreen(p.u ?? p[0], p.v ?? p[1]));
    if (screen.length < 3) return;
    group.appendChild(svgEl('polygon', {
      points: screen.map((s) => `${s.x},${s.y}`).join(' '),
      class: 'cutout-shape',
    }));
    screen.forEach((s, vi) => {
      group.appendChild(svgEl('circle', {
        cx: s.x, cy: s.y, r: 6, class: 'handle cutout-handle',
        'data-handle': 'cutout', 'data-surface': surface.id, 'data-cutout': ci, 'data-vertex': vi,
      }));
    });
  });
}
