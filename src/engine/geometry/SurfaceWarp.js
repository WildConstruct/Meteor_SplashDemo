// SurfaceWarp — bend a flat calibration plane around a curved surface (e.g. the
// drop-off at the front of a car hood). A warp is a control GRID of image-UV
// points: `rows` rows (>= 2) x 2 columns, row-major. Row 0 is the far edge
// (corners A,B at surface v=0); the last row is the near edge (D,C at v=1).
// Interior rows are "slices" you drag to bend a section.
//
// Each row-band between adjacent rows is mapped with its OWN projective
// homography, so flat sections stay perspective-correct (unlike a bilinear
// patch) and adjacent bands meet continuously (C0) at the slice. `blend` eases
// the slope across the slice toward a smooth curve (C1-ish) by cross-fading the
// neighbouring band's mapping in a narrow region around the row boundary.
//
// The sim still runs in the undeformed unit-square surface UV; the warp only
// changes WHERE each (u,v) lands on screen — i.e. it is a forward mesh map, so
// no per-pixel inverse is needed.

import { computeHomography, applyHomography } from './Homography.js';

const xy = (p) => ({ x: p.u ?? p.x, y: p.v ?? p.y });
const uv = (p) => ({ u: p.u ?? p.x, v: p.v ?? p.y });

/** Build a flat 2-row warp grid from a calibration quad [A,B,C,D]. */
export function warpFromQuad(quad) {
  const Q = (quad || []).map(uv);
  if (Q.length !== 4) return null;
  // row 0 (v=0): [A, B]; row 1 (v=1): [D, C]
  return { rows: 2, grid: [[Q[0], Q[1]], [Q[3], Q[2]]], blend: 0.5 };
}

/** The four outer corners (A,B,C,D) of a warp grid, in calibration-quad order. */
export function cornersFromWarp(warp) {
  const g = warp.grid, last = g.length - 1;
  return [g[0][0], g[0][1], g[last][1], g[last][0]].map((p) => ({ x: p.u, y: p.v }));
}

/** Insert a slice row at surface-v = pos (0..1), interpolated on the side edges. */
export function addSlice(warp, pos = 0.5) {
  const g = warp.grid.map((row) => row.map(uv));
  // insert between the two rows that bracket `pos` (rows are evenly spaced in v)
  const rows = g.length;
  const rr = Math.min(rows - 2, Math.max(0, Math.floor(pos * (rows - 1))));
  const t = pos * (rows - 1) - rr;
  const lerp = (a, b, f) => ({ u: a.u + (b.u - a.u) * f, v: a.v + (b.v - a.v) * f });
  const mid = [lerp(g[rr][0], g[rr + 1][0], t), lerp(g[rr][1], g[rr + 1][1], t)];
  g.splice(rr + 1, 0, mid);
  return { ...warp, rows: g.length, grid: g };
}

/** Per-band projective homographies (surface sub-UV -> image), one per row gap. */
function bandHomographies(grid) {
  const bands = [];
  for (let r = 0; r < grid.length - 1; r++) {
    const a = grid[r][0], b = grid[r][1], c = grid[r + 1][1], d = grid[r + 1][0];
    bands.push(computeHomography([xy(a), xy(b), xy(c), xy(d)]).forward);
  }
  return bands;
}

/**
 * Tessellate a warp grid into a triangle mesh.
 * @returns {{positions:Float32Array, uvs:Float32Array, indices:Uint32Array, cols:number, rows:number}}
 *   positions: image-UV per vertex (2 floats); uvs: surface-UV per vertex (2 floats).
 */
export function tessellateWarp(grid, { segU = 24, segV = 24, blend = 0 } = {}) {
  const bands = bandHomographies(grid);
  const nBands = bands.length;
  const cols = segU + 1, rows = segV + 1;
  const positions = new Float32Array(cols * rows * 2);
  const uvs = new Float32Array(cols * rows * 2);

  const evalBand = (bandIdx, su, t) => applyHomography(bands[bandIdx], su, t);

  for (let i = 0; i <= segV; i++) {
    const sv = i / segV;
    const rr = Math.min(nBands - 1e-6, Math.max(0, sv * nBands));
    const band = Math.min(nBands - 1, Math.floor(rr));
    const t = rr - band;
    for (let j = 0; j <= segU; j++) {
      const su = j / segU;
      let [x, y] = evalBand(band, su, t);
      // Ease the crease at interior slices: near a band boundary, cross-fade the
      // adjacent band's mapping so the slope transitions smoothly. Width scales
      // with `blend` (0 = hard crease, 1 = wide smooth bend).
      if (blend > 0 && nBands > 1) {
        const w = 0.5 * blend; // half-width of the blend region in band-t units
        if (t < w && band > 0) {
          const [px, py] = evalBand(band - 1, su, 1 + t); // extrapolate prev band past its end
          const f = smoothstep(0, 1, (w - t) / (2 * w)); // 0 at t=w -> 0.5 at t=0
          x = x + (px - x) * f; y = y + (py - y) * f;
        } else if (t > 1 - w && band < nBands - 1) {
          const [nx, ny] = evalBand(band + 1, su, t - 1); // extrapolate next band before its start
          const f = smoothstep(0, 1, (t - (1 - w)) / (2 * w));
          x = x + (nx - x) * f; y = y + (ny - y) * f;
        }
      }
      const idx = (i * cols + j) * 2;
      positions[idx] = x; positions[idx + 1] = y;
      uvs[idx] = su; uvs[idx + 1] = sv;
    }
  }

  const indices = new Uint32Array(segU * segV * 6);
  let k = 0;
  for (let i = 0; i < segV; i++) {
    for (let j = 0; j < segU; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices[k++] = a; indices[k++] = c; indices[k++] = b;
      indices[k++] = b; indices[k++] = c; indices[k++] = d;
    }
  }
  return { positions, uvs, indices, cols, rows };
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** True when the surface should render through the mesh-warp path. */
export function isWarped(surface) {
  return !!(surface && surface.warp && surface.warp.grid && surface.warp.grid.length > 2);
}
