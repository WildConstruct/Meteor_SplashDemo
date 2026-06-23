// Deterministic integer hash shared by CPU authoring and GPU shaders.
//
// CRITICAL: the exact same arithmetic is mirrored in shaders/common.wgsl
// (`hash_u32`, `combine`, `rand01`). JS uses Math.imul + `>>> 0` to reproduce
// u32 wrap semantics, so CPU event records are byte-equivalent to a GPU eval.
//
// Finalizer is the well-known "lowbias32" mix (Chris Wellons), which has
// excellent avalanche behaviour for sequential indices.

/** @param {number} x @returns {number} u32 */
export function hashU32(x) {
  x = x >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

const GOLDEN = 0x9e3779b1;

/** Combine a running hash with another integer. @returns {number} u32 */
export function combine(acc, value) {
  return hashU32(((acc >>> 0) ^ (Math.imul(value >>> 0, GOLDEN) >>> 0)) >>> 0);
}

/**
 * Hash an arbitrary list of integers into a u32.
 * @param {...number} ints
 * @returns {number} u32
 */
export function seededHash(...ints) {
  let acc = 0x811c9dc5; // FNV offset basis as the seed
  for (let i = 0; i < ints.length; i++) {
    acc = combine(acc, ints[i] | 0);
  }
  return acc >>> 0;
}

/** Map a list of integers to a float in [0, 1). */
export function rand01(...ints) {
  return seededHash(...ints) / 4294967296; // 2^32
}

/** Map to [min, max). */
export function randRange(min, max, ...ints) {
  return min + (max - min) * rand01(...ints);
}

/**
 * Stream-namespaced random: lets placement / response / breakup / shading use
 * independent sequences from the same indices (build plan §13.2).
 */
export const STREAM = Object.freeze({
  PLACEMENT: 0x50_4c_41_43, // "PLAC"
  RESPONSE: 0x52_45_53_50, //  "RESP"
  BREAKUP: 0x42_52_4b_55, //   "BRKU"
  SHADING: 0x53_48_41_44, //   "SHAD"
});

/** rand01 within a named stream. */
export function streamRand(stream, ...ints) {
  return rand01(stream, ...ints);
}
