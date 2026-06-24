// WarpTool — overlay for a BENT surface (a warp grid). Draws the control grid
// (edges + slice rows) and a draggable handle per control point so you can pull a
// section to follow a curved surface (e.g. the front of a hood dropping away).
// The flat 4-corner calibration handles are hidden while warped; these replace
// them. Control points are image UV, like the calibration quad.

import { svgEl } from './ViewportController.js';
import { isWarped } from '../../engine/geometry/SurfaceWarp.js';

export function renderWarp(group, vp, surface, selected) {
  if (!isWarped(surface) || !selected) return;
  const grid = surface.warp.grid;
  const rows = grid.length;
  const scr = grid.map((row) => row.map((p) => vp.uvToScreen(p.u, p.v)));

  // column lines (far edge -> near edge) along each side
  for (let c = 0; c < 2; c++) {
    let d = '';
    for (let r = 0; r < rows; r++) d += `${r ? 'L' : 'M'}${scr[r][c].x},${scr[r][c].y}`;
    group.appendChild(svgEl('path', { d, class: 'warp-edge' }));
  }
  // row lines: outer edges vs interior slice rows (slices read as accent dashes)
  for (let r = 0; r < rows; r++) {
    const slice = r > 0 && r < rows - 1;
    group.appendChild(svgEl('line', {
      x1: scr[r][0].x, y1: scr[r][0].y, x2: scr[r][1].x, y2: scr[r][1].y,
      class: slice ? 'warp-slice' : 'warp-edge',
    }));
  }
  // control-point handles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const corner = r === 0 || r === rows - 1;
      group.appendChild(svgEl('circle', {
        cx: scr[r][c].x, cy: scr[r][c].y, r: 7,
        class: `handle ${corner ? 'corner-handle' : 'warp-handle'}`,
        'data-handle': 'warp-pt', 'data-surface': surface.id, 'data-row': r, 'data-col': c,
      }));
    }
  }
}

/** Map a warp grid (row,col) to the calibration-quad corner index (A B C D). */
export function warpCornerToQuadIndex(row, col, rows) {
  if (row === 0) return col === 0 ? 0 : 1;        // A, B
  if (row === rows - 1) return col === 0 ? 3 : 2; // D, C
  return -1; // interior slice point — no quad corner
}
