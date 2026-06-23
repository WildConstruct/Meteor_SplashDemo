// MeteorPresetAdapter — bridges Meteor's parameter state to the shared Wild
// Construct .wcx format (build plan §10). UUID lookup is authoritative; id is
// fallback. .wcx stores reusable LOOK/behavior parameters only; scene state lives
// in .meteor.json (build plan §10.2).
//
// NOTE: this is a self-contained adapter standing in for the shared WC preset
// manager (not reachable from this repo). The canonical header + UUID contract is
// preserved exactly so it drops onto the shared manager later (see docs ADR).

import { PARAM_MANIFEST, paramDefByUuid, paramDefById } from '../../engine/ParameterState.js';
import { triggerDownload } from './ProjectSerializer.js';

const WCX_VERSION = 1;

// Parameters that belong in a LOOK preset (exclude scene-history params like seed,
// density, drop sizes — those are project state, build plan §10.2).
const LOOK_SECTIONS = new Set(['Look', 'Splash', 'Wet State', 'Relief', 'Global']);
const EXCLUDE_IDS = new Set(['globalSeed', 'debugMode']);

function lookParamIds() {
  return PARAM_MANIFEST.params
    .filter((p) => LOOK_SECTIONS.has(p.section) && !EXCLUDE_IDS.has(p.id))
    .map((p) => p.id);
}

/** Build a canonical .wcx document from the current parameter state. */
export function createWcx(paramState, { name, category = 'Metal', thumbnail = null } = {}) {
  const params = lookParamIds().map((id) => {
    const def = paramDefById(id);
    return { uuid: def.uuid, id, value: paramState.get(id) };
  });
  return {
    _format: 'wcx',
    _plugin: 'meteor',
    _wcxVersion: WCX_VERSION,
    name: name ?? 'Untitled Look',
    category,
    created: new Date().toISOString().slice(0, 10),
    thumbnail: thumbnail ?? null,
    params,
  };
}

/** Validate + apply a .wcx onto a parameter state. Returns {applied, warnings}. */
export function applyWcx(wcx, paramState) {
  const warnings = [];
  if (wcx._format !== 'wcx') throw new Error('not a .wcx file');
  if (wcx._plugin !== 'meteor') throw new Error(`refusing preset for plugin "${wcx._plugin}"`);
  let applied = 0;
  for (const entry of wcx.params ?? []) {
    const def = paramDefByUuid(entry.uuid) ?? paramDefById(entry.id);
    if (!def) {
      warnings.push(`unknown param ${entry.id ?? entry.uuid}`);
      continue;
    }
    if (paramDefByUuid(entry.uuid) == null && entry.id) {
      warnings.push(`param ${entry.id} resolved by id fallback (uuid not found)`);
    }
    paramState.set(def.id, entry.value);
    applied++;
  }
  return { applied, warnings };
}

export function downloadWcx(wcx) {
  const safe = (wcx.name || 'look').toLowerCase().replace(/[^\w]+/g, '-');
  const blob = new Blob([JSON.stringify(wcx, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${safe}.wcx`);
}

export async function importWcxFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}
