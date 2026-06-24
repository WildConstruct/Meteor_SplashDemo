import { describe, it, expect } from 'vitest';
import { warpFromQuad, cornersFromWarp, addSlice, tessellateWarp, isWarped } from '../../../src/engine/geometry/SurfaceWarp.js';
import { computeHomography, applyHomography } from '../../../src/engine/geometry/Homography.js';

const quad = [
  { x: 0.2, y: 0.3 }, // A (0,0)
  { x: 0.8, y: 0.35 }, // B (1,0)
  { x: 0.78, y: 0.7 }, // C (1,1)
  { x: 0.22, y: 0.66 }, // D (0,1)
];
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

describe('SurfaceWarp', () => {
  it('warpFromQuad yields 2 rows whose corners round-trip to the quad', () => {
    const w = warpFromQuad(quad);
    expect(w.rows).toBe(2);
    expect(isWarped({ warp: w })).toBe(false); // 2 rows == flat, not warped
    const c = cornersFromWarp(w);
    [0, 1, 2, 3].forEach((i) => {
      expect(near(c[i].x, quad[i].x)).toBe(true);
      expect(near(c[i].y, quad[i].y)).toBe(true);
    });
  });

  it('flat tessellation matches the projective homography at the corners', () => {
    const w = warpFromQuad(quad);
    const m = tessellateWarp(w.grid, { segU: 4, segV: 4, blend: 0 });
    const fwd = computeHomography(quad).forward;
    // sample every vertex: image pos must equal the homography of its surface uv
    for (let k = 0; k < m.uvs.length; k += 2) {
      const [ex, ey] = applyHomography(fwd, m.uvs[k], m.uvs[k + 1]);
      expect(near(m.positions[k], ex, 1e-4)).toBe(true);
      expect(near(m.positions[k + 1], ey, 1e-4)).toBe(true);
    }
  });

  it('addSlice inserts a middle row and marks the surface warped', () => {
    const w = addSlice(warpFromQuad(quad), 0.5);
    expect(w.rows).toBe(3);
    expect(isWarped({ warp: w })).toBe(true);
    // middle row sits halfway down the side edges
    expect(near(w.grid[1][0].u, (quad[0].x + quad[3].x) / 2, 1e-6)).toBe(true);
    expect(near(w.grid[1][0].v, (quad[0].y + quad[3].y) / 2, 1e-6)).toBe(true);
  });

  it('bending the slice row moves the rendered mesh near the slice', () => {
    const w = addSlice(warpFromQuad(quad), 0.5);
    const flat = tessellateWarp(w.grid, { segU: 4, segV: 4 });
    // push the slice row down in image v
    w.grid[1][0].v += 0.15;
    w.grid[1][1].v += 0.15;
    const bent = tessellateWarp(w.grid, { segU: 4, segV: 4 });
    // a vertex at the slice (sv≈0.5) should have shifted; the far edge (sv=0) must not
    let movedAtSlice = false, farEdgeStill = true;
    for (let k = 0; k < bent.uvs.length; k += 2) {
      const sv = bent.uvs[k + 1];
      const dy = Math.abs(bent.positions[k + 1] - flat.positions[k + 1]);
      if (near(sv, 0.5, 1e-6) && dy > 0.05) movedAtSlice = true;
      // far edge corners are pinned; interior points only shift microscopically
      // from the projective foreshortening of the moved band — tolerate that.
      if (near(sv, 0, 1e-6) && dy > 0.02) farEdgeStill = false;
    }
    expect(movedAtSlice).toBe(true);
    expect(farEdgeStill).toBe(true);
  });

  it('produces a valid index buffer (3 indices per triangle, in range)', () => {
    const m = tessellateWarp(warpFromQuad(quad).grid, { segU: 3, segV: 3 });
    expect(m.indices.length).toBe(3 * 3 * 6);
    const maxIdx = m.cols * m.rows - 1;
    expect(Math.max(...m.indices)).toBeLessThanOrEqual(maxIdx);
  });
});
