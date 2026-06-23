// Hero-event promotion (build plan §14). Promoting a generated impact:
//   1. copies the generated event,
//   2. creates a persistent hero event with independent override controls,
//   3. suppresses ONLY the source generated event,
//   4. preserves every unrelated event and seed.

/**
 * @typedef {object} HeroImpactEvent
 * @property {string} id
 * @property {string|null} sourceStableId
 * @property {string} surfaceId
 * @property {number} frame
 * @property {{u:number,v:number}} surfaceUV
 * @property {string} responseId
 * @property {number|null} heightOverride
 * @property {number|null} widthOverride
 * @property {number|null} bounceOverride
 * @property {number|null} spreadOverride
 * @property {number|null} lifetimeOverride
 * @property {number|null} visualGainOverride
 * @property {boolean} enabled
 */

let heroCounter = 0;

/** Create a hero event from a resolved generated event. */
export function promoteToHero(generatedEvent, responseId) {
  return {
    id: `hero-${(++heroCounter).toString(36)}-${(generatedEvent.stableId || '').replace(/[^\w]/g, '_')}`,
    sourceStableId: generatedEvent.stableId ?? null,
    surfaceId: generatedEvent.surfaceId,
    frame: generatedEvent.frame,
    surfaceUV: { ...generatedEvent.surfaceUV },
    responseId: responseId ?? generatedEvent.responseId ?? 'hero-splash',
    heightOverride: null,
    widthOverride: null,
    bounceOverride: null,
    spreadOverride: null,
    lifetimeOverride: null,
    visualGainOverride: null,
    enabled: true,
  };
}

/** Set of stableIds suppressed because they were promoted. */
export function suppressedSourceIds(heroEvents) {
  const set = new Set();
  for (const h of heroEvents) if (h.sourceStableId) set.add(h.sourceStableId);
  return set;
}

/**
 * Remove suppressed generated events while preserving all others.
 * @template {{stableId?:string}} T
 * @param {T[]} events
 * @param {Set<string>} suppressed
 * @returns {T[]}
 */
export function applySuppression(events, suppressed) {
  if (!suppressed.size) return events;
  return events.filter((e) => !e.stableId || !suppressed.has(e.stableId));
}

/** Reset the internal counter (tests only). */
export function _resetHeroCounter() {
  heroCounter = 0;
}
