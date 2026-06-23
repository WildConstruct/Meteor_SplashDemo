import { describe, it, expect, beforeEach } from 'vitest';
import {
  promoteToHero, suppressedSourceIds, applySuppression, _resetHeroCounter,
} from '../../../src/engine/events/HeroEvents.js';

const generated = [
  { stableId: 'field-a#1', surfaceId: 'hood', frame: 10, surfaceUV: { u: 0.5, v: 0.5 }, responseId: 'metal-tick' },
  { stableId: 'field-a#2', surfaceId: 'hood', frame: 12, surfaceUV: { u: 0.3, v: 0.3 }, responseId: 'metal-bounce' },
  { stableId: 'field-a#3', surfaceId: 'hood', frame: 14, surfaceUV: { u: 0.7, v: 0.4 }, responseId: 'metal-tick' },
];

describe('Hero promotion', () => {
  beforeEach(() => _resetHeroCounter());

  it('promotes a generated event into a persistent hero with overrides', () => {
    const hero = promoteToHero(generated[1], 'hero-splash');
    expect(hero.sourceStableId).toBe('field-a#2');
    expect(hero.surfaceUV).toEqual({ u: 0.3, v: 0.3 });
    expect(hero.responseId).toBe('hero-splash');
    expect(hero.enabled).toBe(true);
    expect(hero.heightOverride).toBeNull();
  });

  it('suppresses ONLY the source event, preserving all others', () => {
    const hero = promoteToHero(generated[1], 'hero-splash');
    const suppressed = suppressedSourceIds([hero]);
    const remaining = applySuppression(generated, suppressed);
    expect(remaining.map((e) => e.stableId)).toEqual(['field-a#1', 'field-a#3']);
  });

  it('copying does not mutate the source event', () => {
    const before = JSON.stringify(generated[1]);
    const hero = promoteToHero(generated[1], 'hero-splash');
    hero.surfaceUV.u = 0.99;
    expect(JSON.stringify(generated[1])).toBe(before);
  });
});
