#!/usr/bin/env node
// One-time generator for plugin.params.json.
//
// Per the build plan (§9.1): every parameter UUID is generated ONCE and
// committed. This script refuses to overwrite an existing manifest so the UUIDs
// remain stable forever. To intentionally regenerate, delete plugin.params.json
// first (do not do this once presets reference the UUIDs).

import { randomUUID } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'plugin.params.json');

if (existsSync(out)) {
  console.log('plugin.params.json already exists — refusing to regenerate UUIDs.');
  process.exit(0);
}

// disk-id counter reserves stable After Effects parameter slots (AE deferred).
let diskId = 1000;
const reserve = () => diskId++;

const p = (def) => ({
  uuid: randomUUID(),
  aeDiskId: reserve(),
  ...def,
});

const params = [
  // --- Global ---
  p({ id: 'globalSeed', name: 'Global Seed', section: 'Global', type: 'int', default: 1337, min: 0, max: 1_000_000, step: 1, historyAffecting: true }),
  p({ id: 'debugMode', name: 'Debug View', section: 'Global', type: 'enum', default: 0, min: 0, max: 8, step: 1, wgsl: 'debugMode',
      options: ['Off', 'Surface UV', 'Impact IDs', 'Wetness', 'Relief', 'Flow', 'Pool', 'Ripple', 'Mask'] }),
  p({ id: 'visualGain', name: 'Overall Visual Gain', section: 'Global', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, wgsl: 'visualGain' }),

  // --- Rain ---
  p({ id: 'rainDensity', name: 'Rain Density', section: 'Rain', type: 'float', default: 0.5, min: 0, max: 1, step: 0.001, historyAffecting: true }),
  p({ id: 'dropSizeMin', name: 'Drop Size Min', section: 'Rain', type: 'float', default: 0.4, min: 0.05, max: 2, step: 0.01, historyAffecting: true }),
  p({ id: 'dropSizeMax', name: 'Drop Size Max', section: 'Rain', type: 'float', default: 1.0, min: 0.05, max: 4, step: 0.01, historyAffecting: true }),
  p({ id: 'impactVelocity', name: 'Impact Velocity', section: 'Rain', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, wgsl: 'impactVelocity' }),

  // --- Splash ---
  p({ id: 'splashHeight', name: 'Splash Height', section: 'Splash', type: 'float', default: 1.0, min: 0, max: 6, step: 0.01, wgsl: 'splashHeight' }),
  p({ id: 'splashWidth', name: 'Splash Width', section: 'Splash', type: 'float', default: 1.0, min: 0, max: 6, step: 0.01, wgsl: 'splashWidth' }),
  p({ id: 'bounce', name: 'Bounce', section: 'Splash', type: 'float', default: 0.4, min: 0, max: 2, step: 0.01, wgsl: 'bounce' }),
  p({ id: 'spread', name: 'Ejecta Spread', section: 'Splash', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, wgsl: 'spread' }),
  p({ id: 'lifetime', name: 'Lifetime', section: 'Splash', type: 'float', default: 1.0, min: 0.1, max: 4, step: 0.01, wgsl: 'lifetime' }),

  // --- Wet State ---
  p({ id: 'wetnessDeposit', name: 'Wetness Deposit', section: 'Wet State', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, historyAffecting: true }),
  p({ id: 'flowSpeed', name: 'Flow Speed', section: 'Wet State', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, historyAffecting: true, wgsl: 'flowSpeed' }),
  p({ id: 'evaporation', name: 'Evaporation', section: 'Wet State', type: 'float', default: 0.15, min: 0, max: 2, step: 0.01, historyAffecting: true, wgsl: 'evaporation' }),

  // --- Relief / Flow ---
  p({ id: 'reliefHeight', name: 'Relief Height', section: 'Relief', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, historyAffecting: true, wgsl: 'reliefHeight' }),
  p({ id: 'reliefSoftness', name: 'Relief Softness', section: 'Relief', type: 'float', default: 0.08, min: 0.001, max: 0.5, step: 0.001, historyAffecting: true, wgsl: 'reliefSoftness' }),
  p({ id: 'flowDeflection', name: 'Flow Deflection', section: 'Relief', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, historyAffecting: true, wgsl: 'flowDeflection' }),
  p({ id: 'boundaryWrap', name: 'Boundary Wrap', section: 'Relief', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, historyAffecting: true, wgsl: 'boundaryWrap' }),

  // --- Wet Look ---
  p({ id: 'wetDarkening', name: 'Wet Darkening', section: 'Look', type: 'float', default: 0.6, min: 0, max: 1.5, step: 0.01, wgsl: 'wetDarkening' }),
  p({ id: 'saturationShift', name: 'Saturation Shift', section: 'Look', type: 'float', default: 0.25, min: -1, max: 1, step: 0.01, wgsl: 'saturationShift' }),
  p({ id: 'specularGain', name: 'Specular Amount', section: 'Look', type: 'float', default: 1.0, min: 0, max: 4, step: 0.01, wgsl: 'specularGain' }),
  p({ id: 'specularWidth', name: 'Specular Width', section: 'Look', type: 'float', default: 0.5, min: 0.01, max: 2, step: 0.01, wgsl: 'specularWidth' }),
  p({ id: 'specularDirection', name: 'Specular Direction', section: 'Look', type: 'float', default: 0.7, min: -3.14159, max: 3.14159, step: 0.01, wgsl: 'specularDirection' }),
  p({ id: 'microNormalStrength', name: 'Micro-Normal Strength', section: 'Look', type: 'float', default: 0.5, min: 0, max: 2, step: 0.01, wgsl: 'microNormalStrength' }),
  p({ id: 'flowStreakStrength', name: 'Flow-Streak Strength', section: 'Look', type: 'float', default: 0.5, min: 0, max: 2, step: 0.01, wgsl: 'flowStreakStrength' }),
  p({ id: 'rippleNormalStrength', name: 'Ripple-Normal Strength', section: 'Look', type: 'float', default: 0.6, min: 0, max: 2, step: 0.01, wgsl: 'rippleNormalStrength' }),
  p({ id: 'poolHighlight', name: 'Pool Highlight', section: 'Look', type: 'float', default: 0.5, min: 0, max: 2, step: 0.01, wgsl: 'poolHighlight' }),
  p({ id: 'distortion', name: 'Distortion Amount', section: 'Look', type: 'float', default: 0.3, min: 0, max: 2, step: 0.01, wgsl: 'distortion' }),
  p({ id: 'edgeBead', name: 'Edge Bead Amount', section: 'Look', type: 'float', default: 0.4, min: 0, max: 2, step: 0.01, wgsl: 'edgeBead' }),
];

const manifest = {
  _manifest: {
    plugin: 'meteor',
    pluginName: 'Meteor',
    vendor: 'Wild Construct',
    schemaVersion: 1,
    description: 'Art-directable environmental-interaction (rain/splash/wet) VFX.',
    note: 'Stable parameter registry. UUIDs are permanent — see scripts/gen-params.mjs.',
  },
  params,
};

writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${out} with ${params.length} parameters.`);
