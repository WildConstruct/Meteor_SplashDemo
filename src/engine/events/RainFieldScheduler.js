// Art-directed, deterministic rain fields (build plan §13, §14).
//
// A RainField owns a FIXED canonical candidate pool. Density selects a stable
// prefix of that pool; moving / scaling / rotating the field only transforms the
// same canonical points. These two invariants are the product proof:
//   - increasing density NEVER moves or retimes already-accepted impacts;
//   - moving a field NEVER reshuffles its pattern.
//
// All randomness flows through SeededHash streams so an Impact-Palette change
// cannot perturb placement.

import { seededHash, streamRand, STREAM } from './SeededHash.js';
import { applyHomography } from '../geometry/Homography.js';

/** Stable 32-bit hash of a string id (FNV-1a). */
export function stringHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export const DEFAULT_POOL_SIZE = 256;

/** Combine project + surface + field into one stable field key. */
export function fieldKey(projectSeed, surfaceId, fieldId) {
  return seededHash(projectSeed >>> 0, stringHash(surfaceId), stringHash(fieldId));
}

/**
 * Canonical candidate pool for a field — independent of density and transform.
 * Each entry is deterministic from (fieldKey, index).
 * @returns {Array<{index:number, localX:number, localY:number, radius:number,
 *   birthFrac:number, sizeRand:number, accept:number, velRand:number, responseRand:number}>}
 */
export function generateCandidates(field, projectSeed) {
  const key = fieldKey(projectSeed, field.surfaceId, field.id);
  const n = field.poolSize ?? DEFAULT_POOL_SIZE;
  const pool = new Array(n);
  for (let i = 0; i < n; i++) {
    // Local position: unit square centred at origin in [-1,1], then radial.
    const lx = streamRand(STREAM.PLACEMENT, key, i, 1) * 2 - 1;
    const ly = streamRand(STREAM.PLACEMENT, key, i, 2) * 2 - 1;
    const radius = Math.hypot(lx, ly);
    pool[i] = {
      index: i,
      localX: lx,
      localY: ly,
      radius,
      birthFrac: streamRand(STREAM.PLACEMENT, key, i, 3),
      sizeRand: streamRand(STREAM.PLACEMENT, key, i, 4),
      accept: streamRand(STREAM.PLACEMENT, key, i, 5),
      velRand: streamRand(STREAM.PLACEMENT, key, i, 6),
      // response stream is INDEPENDENT — palette changes never move points.
      responseRand: streamRand(STREAM.RESPONSE, key, i, 1),
    };
  }
  return pool;
}

/** Radial falloff weight in [0,1]; falloff=0 -> flat, falloff=1 -> soft edge. */
function falloffWeight(radius, falloff) {
  if (falloff <= 0) return 1;
  // radius>1 corner is allowed; clamp soft edge at r=1.
  const t = Math.min(1, radius);
  return 1 - falloff * smoothstep(1 - falloff, 1, t);
}

function smoothstep(a, b, x) {
  if (a === b) return x < a ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Select accepted candidates for a density in [0,1]. Monotonic: a candidate
 * accepted at density d stays accepted for every density >= d.
 */
export function selectAccepted(pool, density, falloff = 0) {
  const out = [];
  for (const c of pool) {
    const threshold = density * falloffWeight(c.radius, falloff);
    if (c.accept < threshold) out.push(c);
  }
  return out;
}

/** Transform a canonical candidate's local position into surface UV. */
export function candidateToSurfaceUV(c, field) {
  const cos = Math.cos(field.rotation ?? 0);
  const sin = Math.sin(field.rotation ?? 0);
  const sx = (field.scaleUV?.x ?? 0.25) * c.localX;
  const sy = (field.scaleUV?.y ?? 0.25) * c.localY;
  const rx = sx * cos - sy * sin;
  const ry = sx * sin + sy * cos;
  return {
    u: (field.centerUV?.u ?? 0.5) + rx,
    v: (field.centerUV?.v ?? 0.5) + ry,
  };
}

/**
 * Build deterministic ImpactEvent records for a field. Same project + seed +
 * field always yields byte-equivalent records.
 * @returns {Array<object>} ImpactEvent[]
 */
export function buildFieldEvents(field, projectSeed, globals = {}) {
  const pool = generateCandidates(field, projectSeed);
  const accepted = selectAccepted(pool, clamp01(field.density ?? 0.5), field.falloff ?? 0);
  const start = field.startFrame ?? 0;
  const end = field.endFrame ?? 0;
  const span = Math.max(0, end - start);

  const [dMin, dMax] = field.dropSizeRange ?? [globals.dropSizeMin ?? 0.4, globals.dropSizeMax ?? 1.0];
  const [vMin, vMax] = field.velocityRange ?? [0.6, 1.4];

  const events = [];
  for (const c of accepted) {
    const uv = candidateToSurfaceUV(c, field);
    events.push({
      stableId: `${field.id}#${c.index}`,
      surfaceId: field.surfaceId,
      sourceFieldId: field.id,
      frame: start + Math.floor(c.birthFrac * span),
      surfaceUV: uv,
      dropSize: dMin + (dMax - dMin) * c.sizeRand,
      incomingVelocity: vMin + (vMax - vMin) * c.velRand,
      responseRand: c.responseRand,
      responseSeed: seededHash(stringHash(field.id), c.index) >>> 0,
      paletteId: field.paletteId ?? null,
      candidateIndex: c.index,
    });
  }
  // Stable order: birth frame, then candidate index.
  events.sort((a, b) => a.frame - b.frame || a.candidateIndex - b.candidateIndex);
  return events;
}

/** Events whose response is visible at `frame` given a lifetime in frames. */
export function activeEvents(events, frame, lifetimeFrames) {
  return events.filter((e) => frame >= e.frame && frame < e.frame + lifetimeFrames);
}

/** Project an event's surface UV into image UV using a homography. */
export function eventImageUV(event, homographyForward) {
  return applyHomography(homographyForward, event.surfaceUV.u, event.surfaceUV.v);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
