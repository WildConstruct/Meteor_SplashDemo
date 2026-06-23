import { describe, it, expect } from 'vitest';
import { computeHomography, applyHomography, quadSignedArea } from '../../../src/engine/geometry/Homography.js';

// image-UV is y-down; a correctly-wound A,B,C,D quad => negative signed area
const goodQuad = [
  { x: 0.2, y: 0.3 }, // A (0,0)
  { x: 0.8, y: 0.35 }, // B (1,0)
  { x: 0.75, y: 0.7 }, // C (1,1)
  { x: 0.25, y: 0.65 }, // D (0,1)
];

describe('Homography', () => {
  it('maps the unit-square corners onto the quad', () => {
    const h = computeHomography(goodQuad);
    expect(h.valid).toBe(true);
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
    corners.forEach(([u, v], i) => {
      const [x, y] = applyHomography(h.forward, u, v);
      expect(x).toBeCloseTo(goodQuad[i].x, 6);
      expect(y).toBeCloseTo(goodQuad[i].y, 6);
    });
  });

  it('forward then inverse round-trips', () => {
    const h = computeHomography(goodQuad);
    for (const [u, v] of [[0.25, 0.4], [0.6, 0.6], [0.5, 0.5]]) {
      const [x, y] = applyHomography(h.forward, u, v);
      const [u2, v2] = applyHomography(h.inverse, x, y);
      expect(u2).toBeCloseTo(u, 6);
      expect(v2).toBeCloseTo(v, 6);
    }
  });

  it('detects a self-intersecting (bowtie) quad', () => {
    const bowtie = [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.8 },
      { x: 0.8, y: 0.2 },
      { x: 0.2, y: 0.8 },
    ];
    const h = computeHomography(bowtie);
    expect(h.warnings.join(' ')).toMatch(/self-intersecting|inverted/);
    expect(h.valid).toBe(false);
  });

  it('detects near-zero area', () => {
    const degenerate = [
      { x: 0.2, y: 0.5 },
      { x: 0.21, y: 0.5 },
      { x: 0.22, y: 0.5 },
      { x: 0.23, y: 0.5 },
    ];
    const h = computeHomography(degenerate);
    expect(h.valid).toBe(false);
  });

  it('signed area sign indicates winding (y-down: positive => correct)', () => {
    expect(quadSignedArea(goodQuad)).toBeGreaterThan(0);
  });
});
