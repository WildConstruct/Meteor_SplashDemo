import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { ParameterState, paramDefById } from '../../src/engine/ParameterState.js';
import { createWcx, applyWcx } from '../../src/client/serialization/MeteorPresetAdapter.js';

const here = dirname(fileURLToPath(import.meta.url));
const factoryDir = resolve(here, '../../src/presets/factory');

describe('.wcx preset adapter', () => {
  it('createWcx emits the canonical header and resolvable UUIDs', () => {
    const ps = new ParameterState();
    ps.set('splashHeight', 2.0);
    const wcx = createWcx(ps, { name: 'Test' });
    expect(wcx._format).toBe('wcx');
    expect(wcx._plugin).toBe('meteor');
    expect(wcx._wcxVersion).toBe(1);
    const sh = wcx.params.find((p) => p.id === 'splashHeight');
    expect(sh.uuid).toBe(paramDefById('splashHeight').uuid);
    expect(sh.value).toBe(2.0);
  });

  it('applyWcx resolves by UUID (authoritative)', () => {
    const ps = new ParameterState();
    const wcx = {
      _format: 'wcx', _plugin: 'meteor', _wcxVersion: 1, params: [
        { uuid: paramDefById('splashHeight').uuid, id: 'WRONG_ID', value: 3.3 },
      ],
    };
    const { applied } = applyWcx(wcx, ps);
    expect(applied).toBe(1);
    expect(ps.get('splashHeight')).toBeCloseTo(3.3); // resolved by uuid despite bad id
  });

  it('applyWcx falls back to id when uuid is unknown, with a warning', () => {
    const ps = new ParameterState();
    const { applied, warnings } = applyWcx(ps && {
      _format: 'wcx', _plugin: 'meteor', _wcxVersion: 1,
      params: [{ uuid: 'not-a-real-uuid', id: 'bounce', value: 1.5 }],
    }, ps);
    expect(applied).toBe(1);
    expect(ps.get('bounce')).toBeCloseTo(1.5);
    expect(warnings.join(' ')).toMatch(/id fallback/);
  });

  it('rejects presets for another plugin', () => {
    const ps = new ParameterState();
    expect(() => applyWcx({ _format: 'wcx', _plugin: 'otis', params: [] }, ps)).toThrow(/plugin/);
  });

  it('round-trips create -> apply', () => {
    const a = new ParameterState();
    a.set('specularGain', 2.5);
    a.set('wetDarkening', 1.1);
    const wcx = createWcx(a, { name: 'RT' });
    const b = new ParameterState();
    applyWcx(wcx, b);
    expect(b.get('specularGain')).toBeCloseTo(2.5);
    expect(b.get('wetDarkening')).toBeCloseTo(1.1);
  });

  it('every committed factory preset applies cleanly by UUID', () => {
    for (const file of readdirSync(factoryDir).filter((f) => f.endsWith('.wcx'))) {
      const wcx = JSON.parse(readFileSync(join(factoryDir, file), 'utf8'));
      const ps = new ParameterState();
      const { applied, warnings } = applyWcx(wcx, ps);
      expect(applied).toBe(wcx.params.length);
      expect(warnings).toEqual([]); // all resolve by uuid, none by id fallback
    }
  });
});
