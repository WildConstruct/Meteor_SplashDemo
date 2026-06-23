// ImpactPicking — client-side hit testing of impact dots using projected screen
// positions (build plan §13.3: "no GPU readback is needed"). The editor projects
// candidates and tests the pointer against them.

import { buildFieldEvents } from '../../engine/events/RainFieldScheduler.js';

/**
 * Find the impact event nearest a pointer (image UV) within a screen radius.
 * @returns {{event:object, field:object}|null}
 */
export function pickImpact(state, vp, pointerScreen, radiusPx = 10) {
  let best = null;
  let bestDist = radiusPx;
  const seed = state.project.globalSeed;
  const params = state.params.toObject();

  for (const surface of state.surfaces()) {
    for (const field of surface.rainFields ?? []) {
      const events = buildFieldEvents(field, seed, params);
      for (const ev of events) {
        const s = vp.surfaceUVToScreen(surface.id, ev.surfaceUV.u, ev.surfaceUV.v);
        const d = Math.hypot(s.x - pointerScreen.x, s.y - pointerScreen.y);
        if (d < bestDist) {
          bestDist = d;
          best = { event: ev, field };
        }
      }
    }
  }
  return best;
}
