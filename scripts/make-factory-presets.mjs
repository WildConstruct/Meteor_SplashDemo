#!/usr/bin/env node
// Generates the three factory .wcx look presets from plugin.params.json so their
// UUIDs always match the committed manifest (build plan §10). Re-runnable.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const manifest = JSON.parse(readFileSync(join(root, 'plugin.params.json'), 'utf8'));
const byId = new Map(manifest.params.map((p) => [p.id, p]));

const LOOK_SECTIONS = new Set(['Look', 'Splash', 'Wet State', 'Relief', 'Global']);
const EXCLUDE = new Set(['globalSeed', 'debugMode']);
const lookIds = manifest.params
  .filter((p) => LOOK_SECTIONS.has(p.section) && !EXCLUDE.has(p.id))
  .map((p) => p.id);

function preset(name, category, overrides) {
  const params = lookIds.map((id) => {
    const def = byId.get(id);
    const value = overrides[id] ?? def.default;
    return { uuid: def.uuid, id, value: clamp(value, def.min, def.max) };
  });
  return {
    _format: 'wcx',
    _plugin: 'meteor',
    _wcxVersion: 1,
    name,
    category,
    created: '2026-06-23',
    thumbnail: null,
    params,
  };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

const outDir = join(root, 'src', 'presets', 'factory');
mkdirSync(outDir, { recursive: true });

const presets = {
  'directed-metal-hood.wcx': preset('Directed Metal Hood', 'Metal', {
    splashHeight: 1.8, splashWidth: 0.9, bounce: 1.1, spread: 1.3,
    wetDarkening: 0.5, specularGain: 1.8, specularWidth: 0.35,
    microNormalStrength: 0.7, flowStreakStrength: 0.8, reliefHeight: 1.2,
    flowDeflection: 1.4, boundaryWrap: 1.6, distortion: 0.2, edgeBead: 0.6,
  }),
  'subtle-wet-metal.wcx': preset('Subtle Wet Metal', 'Metal', {
    splashHeight: 0.8, splashWidth: 0.7, bounce: 0.4, spread: 0.6,
    wetDarkening: 0.35, specularGain: 0.9, specularWidth: 0.6,
    microNormalStrength: 0.3, flowStreakStrength: 0.3, poolHighlight: 0.3,
    distortion: 0.1, edgeBead: 0.25,
  }),
  'heavy-puddle.wcx': preset('Heavy Puddle', 'Puddle', {
    splashHeight: 1.2, splashWidth: 1.8, bounce: 0.3, spread: 1.6,
    wetDarkening: 0.9, saturationShift: 0.4, specularGain: 1.4, specularWidth: 0.8,
    rippleNormalStrength: 1.0, poolHighlight: 1.2, flowSpeed: 1.4,
    distortion: 0.8, edgeBead: 0.5, evaporation: 0.08,
  }),
};

for (const [file, doc] of Object.entries(presets)) {
  writeFileSync(join(outDir, file), JSON.stringify(doc, null, 2) + '\n');
  console.log(`wrote ${file} (${doc.params.length} params)`);
}
