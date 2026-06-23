// Host <-> engine contract (build plan §8). This file documents-as-code the
// inputs the engine receives and the structured status it returns. The engine
// never acquires a device, canvas, or file — the host (browser now, Dawn later)
// supplies all of these.

/**
 * @typedef {object} EngineCreateOptions
 * @property {GPUDevice} device
 * @property {GPUQueue} queue
 * @property {GPUTextureFormat} outputFormat  - injected, never hard-coded
 * @property {Record<string,string>} shaderSources - filename -> WGSL source text
 * @property {(d:Diagnostic)=>void} [diagnostics]
 *
 * @typedef {object} RenderArgs
 * @property {GPUTextureView} inputTextureView
 * @property {GPUTextureView} outputTextureView
 * @property {number} width
 * @property {number} height
 * @property {number} pixelAspect
 * @property {number} frameIndex
 * @property {number} timeSeconds
 * @property {number} frameRate
 * @property {number} [renderQuality]
 * @property {number} [debugMode]
 *
 * @typedef {object} Diagnostic
 * @property {'info'|'warn'|'error'} level
 * @property {string} code
 * @property {string} message
 * @property {object} [data]
 */

export const RENDER_QUALITY = Object.freeze({ DRAFT: 0, NORMAL: 1, HIGH: 2 });

export const DEBUG_MODE = Object.freeze({
  OFF: 0,
  SURFACE_UV: 1,
  IMPACT_IDS: 2,
  WETNESS: 3,
  RELIEF: 4,
  FLOW: 5,
  POOL: 6,
  RIPPLE: 7,
  MASK: 8,
});

/** Fixed wet-state simulation rate (build plan §17.1, §21.2). */
export const SIM_HZ = 30;

/**
 * Wet-state cache key (build plan §21.3). Same key => same simulation history.
 * Look-only parameter changes do NOT alter this key.
 */
export function buildCacheKey({
  schemaHash,
  topologyHash,
  paramHistoryHash,
  simResolution,
  frameRate,
  projectSeed,
}) {
  return [
    `schema:${schemaHash}`,
    `topo:${topologyHash}`,
    `params:${paramHistoryHash}`,
    `res:${simResolution}`,
    `fps:${frameRate}`,
    `seed:${projectSeed}`,
  ].join('#');
}

/** Cheap stable string hash for cache-key components. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16);
}

export function makeDiagnostic(level, code, message, data) {
  return { level, code, message, data };
}
