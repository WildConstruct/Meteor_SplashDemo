import { describe, it, expect } from 'vitest';
import { buildCacheKey } from '../../../src/engine/EngineContracts.js';
import { ParameterState } from '../../../src/engine/ParameterState.js';

describe('Wet-state cache key classification', () => {
  const base = {
    schemaHash: 'a', topologyHash: 't', paramHistoryHash: 'p',
    simResolution: 256, frameRate: 30, projectSeed: 1337,
  };

  it('is stable for identical inputs', () => {
    expect(buildCacheKey(base)).toBe(buildCacheKey(base));
  });

  it('changes when topology changes', () => {
    expect(buildCacheKey(base)).not.toBe(buildCacheKey({ ...base, topologyHash: 'u' }));
  });

  it('changes when seed changes', () => {
    expect(buildCacheKey(base)).not.toBe(buildCacheKey({ ...base, projectSeed: 1 }));
  });

  it('history hash only reflects history-affecting params', () => {
    const ps = new ParameterState();
    const h0 = ps.historyHash();
    ps.set('wetDarkening', 1.2); // LOOK param (not history-affecting)
    expect(ps.historyHash()).toBe(h0);
    ps.set('rainDensity', 0.9); // history-affecting
    expect(ps.historyHash()).not.toBe(h0);
  });
});
