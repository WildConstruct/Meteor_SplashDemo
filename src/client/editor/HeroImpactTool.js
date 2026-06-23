// HeroImpactTool — promote a picked generated impact to a hero event, then move /
// retime / exaggerate it independently (build plan §14, Milestone 4 + §4 steps
// 9-10). Promotion suppresses ONLY the source generated event.

import { promoteToHero } from '../../engine/events/HeroEvents.js';
import { getResponse } from '../../engine/responses/response-schema.js';

/** Promote a picked event and append a hero to the project. Returns the hero. */
export function promotePicked(state, picked, { notify } = {}) {
  const resolved = {
    ...picked.event,
    responseId: picked.event.responseId ?? 'hero-splash',
  };
  const hero = promoteToHero(resolved, 'hero-splash');
  state.addHeroEvent(hero);
  notify?.info(`Promoted ${picked.event.stableId} → hero (move/retime it now)`);
  return hero;
}

/** Move a hero to a new surface UV. */
export function moveHero(state, heroId, surfaceUV) {
  const hero = state.project.heroEvents.find((h) => h.id === heroId);
  if (!hero) return;
  hero.surfaceUV = { ...surfaceUV };
  state.emit('hero');
}

/** Retime a hero. */
export function retimeHero(state, heroId, frame) {
  const hero = state.project.heroEvents.find((h) => h.id === heroId);
  if (!hero) return;
  hero.frame = Math.max(0, Math.round(frame));
  state.emit('hero');
}

/** Set an override (heightOverride, widthOverride, ...). */
export function setHeroOverride(state, heroId, key, value) {
  const hero = state.project.heroEvents.find((h) => h.id === heroId);
  if (!hero) return;
  hero[key] = value;
  state.emit('hero');
}

export function defaultHeroLifetimeFrames(hero, frameRate) {
  const resp = getResponse(hero.responseId);
  return resp.lifetime * frameRate;
}
