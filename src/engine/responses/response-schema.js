// Impact response schema + loader (build plan §15). Responses are data-driven
// recipes combining a contact mark, an atlas/analytic crown, analytic ballistic
// droplets, a ripple impulse, and a wetness/water deposit.

import metalTick from './metal-tick.json';
import metalBounce from './metal-bounce.json';
import puddleCrown from './puddle-crown.json';
import heroSplash from './hero-splash.json';

/**
 * @typedef {object} ImpactResponse
 * @property {string} id
 * @property {string} name
 * @property {'ring'|'crown'|'atlas'} contactMode
 * @property {number} atlasEntry
 * @property {number} lifetime          seconds
 * @property {number[]} radiusCurve     control points 0..1
 * @property {number[]} heightCurve     control points 0..1
 * @property {number} reboundProbability
 * @property {number} secondaryCount
 * @property {number} secondarySpeed
 * @property {number} secondarySpread
 * @property {number} directionalBias
 * @property {number} wetnessDeposit
 * @property {number} waterDeposit
 * @property {number} rippleImpulse
 * @property {number} visualGain
 */

const DEFAULTS = {
  contactMode: 'ring',
  atlasEntry: 0,
  lifetime: 0.5,
  radiusCurve: [0, 1],
  heightCurve: [0, 1, 0],
  reboundProbability: 0,
  secondaryCount: 4,
  secondarySpeed: 1,
  secondarySpread: 1,
  directionalBias: 0,
  wetnessDeposit: 0.5,
  waterDeposit: 0.2,
  rippleImpulse: 0.3,
  visualGain: 1,
};

export function normalizeResponse(raw) {
  return { ...DEFAULTS, ...raw };
}

const ALL = [metalTick, metalBounce, puddleCrown, heroSplash].map(normalizeResponse);

export const RESPONSES = ALL;
export const RESPONSES_BY_ID = new Map(ALL.map((r) => [r.id, r]));

export function getResponse(id) {
  return RESPONSES_BY_ID.get(id) ?? RESPONSES_BY_ID.get('metal-tick');
}

/** Stable integer index for packing into GPU buffers. */
export const RESPONSE_INDEX = new Map(ALL.map((r, i) => [r.id, i]));
