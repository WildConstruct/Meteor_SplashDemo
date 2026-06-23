import { describe, it, expect } from 'vitest';
import { hashU32, combine, seededHash, rand01, streamRand, STREAM } from '../../../src/engine/events/SeededHash.js';

describe('SeededHash', () => {
  it('hashU32 is deterministic and matches golden vectors', () => {
    // Golden vectors — if these change, the WGSL mirror (common.wgsl) must change too.
    expect(hashU32(0)).toBe(0);
    expect(hashU32(1)).toBe(0x688990c0 >>> 0); // locks the formula <-> common.wgsl
    expect(hashU32(2)).toBe(0xd1132181 >>> 0);
    expect(hashU32(0xffffffff)).toBe(hashU32(0xffffffff)); // stable
  });

  it('combine wraps in u32 space', () => {
    const a = combine(123, 456);
    expect(a).toBe(a >>> 0);
    expect(a).toBe(combine(123, 456));
  });

  it('rand01 is in [0,1) and deterministic', () => {
    for (let i = 0; i < 1000; i++) {
      const r = rand01(i, i * 7, 3);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
    expect(rand01(5, 6, 7)).toBe(rand01(5, 6, 7));
  });

  it('streams are independent', () => {
    const a = streamRand(STREAM.PLACEMENT, 10, 20, 30);
    const b = streamRand(STREAM.RESPONSE, 10, 20, 30);
    expect(a).not.toBe(b);
  });

  it('distribution is roughly uniform', () => {
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) sum += rand01(i, 1, 1);
    const mean = sum / n;
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
  });
});
