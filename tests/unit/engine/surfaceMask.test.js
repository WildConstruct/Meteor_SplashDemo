import { describe, it, expect } from 'vitest';
import { rasterizeMask } from '../../../src/engine/geometry/SurfaceMask.js';

// full-coverage square so interior sampling is unambiguous
const square = [
  { u: 0.0, v: 0.0 }, { u: 1.0, v: 0.0 },
  { u: 1.0, v: 1.0 }, { u: 0.0, v: 1.0 },
];
const at = (data, res, u, v) => data[Math.floor(v * res) * res + Math.floor(u * res)];

describe('rasterizeMask', () => {
  const res = 64;

  it('fills the interior of the include polygon', () => {
    const m = rasterizeMask(square, res, res);
    expect(at(m, res, 0.5, 0.5)).toBe(255);
  });

  it('subtracts cutout polygons (carves a hole)', () => {
    const hole = [
      { u: 0.4, v: 0.4 }, { u: 0.6, v: 0.4 },
      { u: 0.6, v: 0.6 }, { u: 0.4, v: 0.6 },
    ];
    const m = rasterizeMask(square, res, res, { cutouts: [hole] });
    expect(at(m, res, 0.5, 0.5)).toBe(0); // inside the hole -> carved out
    expect(at(m, res, 0.1, 0.1)).toBe(255); // outside the hole -> still wet
  });

  it('feather softens the edge into a gradient (no longer a hard 0/255 step)', () => {
    const sharp = rasterizeMask(square, res, res, { feather: 0 });
    const soft = rasterizeMask(square, res, res, { feather: 1 });
    // near the top edge, a wide feather produces an intermediate value
    const edgeSoft = at(soft, res, 0.5, 0.02);
    expect(edgeSoft).toBeGreaterThan(0);
    expect(edgeSoft).toBeLessThan(255);
    // a strong feather should not leave the edge as crisp as no feather
    expect(edgeSoft).toBeLessThan(at(sharp, res, 0.5, 0.5));
  });

  it('returns an empty mask for a degenerate polygon', () => {
    const m = rasterizeMask([{ u: 0, v: 0 }], res, res);
    expect(m.every((x) => x === 0)).toBe(true);
  });
});
