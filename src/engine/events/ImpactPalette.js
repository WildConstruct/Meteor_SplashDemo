// Impact palettes: weighted, deterministic response selection (build plan §13.2,
// §15). Selection uses each event's INDEPENDENT response random value, so mixing
// looks or reweighting a palette never moves or retimes an impact.

/**
 * @typedef {{ responseId:string, weight:number }} PaletteEntry
 * @typedef {{ id:string, name:string, entries:PaletteEntry[] }} ImpactPalette
 */

/** Pick a responseId from a palette using a [0,1) random value. */
export function pickResponse(palette, responseRand) {
  if (!palette || !palette.entries?.length) return null;
  const total = palette.entries.reduce((s, e) => s + Math.max(0, e.weight), 0);
  if (total <= 0) return palette.entries[0].responseId;
  let acc = 0;
  const target = responseRand * total;
  for (const e of palette.entries) {
    acc += Math.max(0, e.weight);
    if (target < acc) return e.responseId;
  }
  return palette.entries[palette.entries.length - 1].responseId;
}

/** Resolve every event to its responseId without mutating placement. */
export function resolveResponses(events, palettesById, fallbackResponseId) {
  return events.map((e) => {
    const palette = e.paletteId ? palettesById.get(e.paletteId) : null;
    const responseId = pickResponse(palette, e.responseRand) ?? fallbackResponseId;
    return { ...e, responseId };
  });
}

export function makePalette(id, name, entries) {
  return { id, name, entries };
}
