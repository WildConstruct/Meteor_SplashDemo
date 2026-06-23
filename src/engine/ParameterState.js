// Parameter state derived from the committed plugin.params.json manifest
// (build plan §9.1). Holds current scalar values, knows which parameters affect
// wet-state history (for cache-key classification), and packs the WGSL-bound
// scalars into a Float32Array for the engine's parameter uniform.

import manifest from '../../plugin.params.json';

export const PARAM_MANIFEST = manifest;

const DEFS = manifest.params;
const BY_ID = new Map(DEFS.map((d) => [d.id, d]));
const BY_UUID = new Map(DEFS.map((d) => [d.uuid, d]));

export function paramDefById(id) {
  return BY_ID.get(id);
}
export function paramDefByUuid(uuid) {
  return BY_UUID.get(uuid);
}

/** All parameter ids that have a WGSL binding, in manifest order. */
export const WGSL_PARAM_IDS = DEFS.filter((d) => d.wgsl).map((d) => d.id);

export class ParameterState {
  constructor(overrides = {}) {
    /** @type {Map<string, number>} */
    this.values = new Map();
    for (const d of DEFS) this.values.set(d.id, d.default);
    this.applyOverrides(overrides);
  }

  get(id) {
    return this.values.get(id);
  }

  set(id, value) {
    const def = BY_ID.get(id);
    if (!def) return false;
    let v = Number(value);
    if (Number.isNaN(v)) return false;
    if (def.type === 'int' || def.type === 'enum') v = Math.round(v);
    v = Math.min(def.max, Math.max(def.min, v));
    this.values.set(id, v);
    return true;
  }

  applyOverrides(overrides) {
    for (const [id, v] of Object.entries(overrides || {})) this.set(id, v);
  }

  /** Plain object of all values (for serialization). */
  toObject() {
    return Object.fromEntries(this.values);
  }

  /**
   * Stable string of all history-affecting parameter values, used by the
   * wet-state cache key (build plan §21.3). Changing a non-history parameter
   * (a look control) does not invalidate simulation history.
   */
  historyHash() {
    const parts = [];
    for (const d of DEFS) {
      if (d.historyAffecting) parts.push(`${d.id}=${this.values.get(d.id)}`);
    }
    return parts.join('|');
  }

  /**
   * Pack WGSL-bound scalars into a Float32Array in a STABLE order. The same
   * order is documented in docs/shader-bindings.md and consumed by
   * shaders/common.wgsl's `Params` struct.
   */
  packUniform() {
    const arr = new Float32Array(WGSL_PARAM_IDS.length);
    WGSL_PARAM_IDS.forEach((id, i) => {
      arr[i] = this.values.get(id);
    });
    return arr;
  }
}

/** Field layout of the packed uniform, for the shader struct + docs. */
export function packedUniformLayout() {
  return WGSL_PARAM_IDS.map((id, i) => ({ index: i, id, wgsl: BY_ID.get(id).wgsl }));
}
