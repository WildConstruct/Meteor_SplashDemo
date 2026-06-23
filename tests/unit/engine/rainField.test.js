import { describe, it, expect } from 'vitest';
import {
  generateCandidates, selectAccepted, candidateToSurfaceUV, buildFieldEvents,
} from '../../../src/engine/events/RainFieldScheduler.js';

const baseField = {
  id: 'field-a',
  surfaceId: 'hood',
  centerUV: { u: 0.5, v: 0.5 },
  scaleUV: { x: 0.3, y: 0.2 },
  rotation: 0.2,
  density: 0.5,
  falloff: 0.3,
  startFrame: 0,
  endFrame: 120,
  dropSizeRange: [0.4, 1.0],
  velocityRange: [0.6, 1.4],
  paletteId: null,
};

describe('RainFieldScheduler determinism', () => {
  it('candidate pool is deterministic for same seed', () => {
    const a = generateCandidates(baseField, 1337);
    const b = generateCandidates(baseField, 1337);
    expect(a).toEqual(b);
  });

  it('different seed changes the pool', () => {
    const a = generateCandidates(baseField, 1337);
    const b = generateCandidates(baseField, 9999);
    expect(a[0]).not.toEqual(b[0]);
  });

  it('increasing density is monotonic — never drops an accepted candidate', () => {
    const pool = generateCandidates(baseField, 1337);
    let prev = new Set(selectAccepted(pool, 0.1, 0).map((c) => c.index));
    for (let d = 0.2; d <= 1.0001; d += 0.1) {
      const next = new Set(selectAccepted(pool, d, 0).map((c) => c.index));
      for (const id of prev) expect(next.has(id)).toBe(true); // all kept
      expect(next.size).toBeGreaterThanOrEqual(prev.size);
      prev = next;
    }
  });

  it('moving the field does not change the canonical pattern (only the transform)', () => {
    const pool = generateCandidates(baseField, 1337);
    const moved = { ...baseField, centerUV: { u: 0.2, v: 0.7 } };
    const movedPool = generateCandidates(moved, 1337);
    // canonical local positions identical
    expect(pool.map((c) => [c.localX, c.localY])).toEqual(movedPool.map((c) => [c.localX, c.localY]));
    // surface UV differs by exactly the center delta (rotation/scale unchanged)
    const a = candidateToSurfaceUV(pool[0], baseField);
    const b = candidateToSurfaceUV(movedPool[0], moved);
    expect(b.u - a.u).toBeCloseTo(0.2 - 0.5, 6);
    expect(b.v - a.v).toBeCloseTo(0.7 - 0.5, 6);
  });

  it('changing palette/response does not move impacts', () => {
    const a = buildFieldEvents({ ...baseField, paletteId: 'p1' }, 1337);
    const b = buildFieldEvents({ ...baseField, paletteId: 'p2' }, 1337);
    expect(a.map((e) => [e.stableId, e.surfaceUV.u, e.surfaceUV.v, e.frame]))
      .toEqual(b.map((e) => [e.stableId, e.surfaceUV.u, e.surfaceUV.v, e.frame]));
  });

  it('events are byte-equivalent across runs (same seed + field)', () => {
    const a = buildFieldEvents(baseField, 1337);
    const b = buildFieldEvents(baseField, 1337);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('stable ids carry the candidate index', () => {
    const events = buildFieldEvents(baseField, 1337);
    for (const e of events) expect(e.stableId).toMatch(/^field-a#\d+$/);
  });
});
