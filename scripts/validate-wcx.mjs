#!/usr/bin/env node
// .wcx factory-preset validation gate (build plan §10).
//
// Verifies every preset under src/presets/factory/:
//   - has canonical header (_format=wcx, _plugin=meteor, _wcxVersion=1)
//   - every param uuid resolves against the committed plugin.params.json
//   - param values lie within the manifest min/max

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const factoryDir = join(root, 'src', 'presets', 'factory');
const manifest = JSON.parse(readFileSync(join(root, 'plugin.params.json'), 'utf8'));

const byUuid = new Map(manifest.params.map((p) => [p.uuid, p]));
const byId = new Map(manifest.params.map((p) => [p.id, p]));

if (!existsSync(factoryDir)) {
  console.warn('[validate:wcx] no factory dir yet — skipping.');
  process.exit(0);
}

const files = readdirSync(factoryDir).filter((f) => f.endsWith('.wcx'));
let failed = 0;

for (const file of files) {
  const errs = [];
  let doc;
  try {
    doc = JSON.parse(readFileSync(join(factoryDir, file), 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}: invalid JSON — ${e.message}`);
    failed++;
    continue;
  }
  if (doc._format !== 'wcx') errs.push('_format must be "wcx"');
  if (doc._plugin !== 'meteor') errs.push('_plugin must be "meteor"');
  if (doc._wcxVersion !== 1) errs.push('_wcxVersion must be 1');
  if (!Array.isArray(doc.params)) errs.push('params must be an array');

  for (const entry of doc.params || []) {
    const def = byUuid.get(entry.uuid) || byId.get(entry.id);
    if (!def) {
      errs.push(`param ${entry.id ?? entry.uuid} resolves to no manifest entry`);
      continue;
    }
    if (def.uuid !== entry.uuid) {
      errs.push(`param ${entry.id}: uuid mismatch (expected ${def.uuid})`);
    }
    if (typeof entry.value === 'number') {
      if (entry.value < def.min || entry.value > def.max) {
        errs.push(`param ${def.id}: value ${entry.value} outside [${def.min}, ${def.max}]`);
      }
    }
  }

  if (errs.length) {
    console.error(`✗ ${file}`);
    for (const e of errs) console.error('    ' + e);
    failed++;
  } else {
    console.log(`✓ ${file} (${doc.params.length} params)`);
  }
}

if (failed) {
  console.error(`\n[validate:wcx] ${failed} preset(s) failed.`);
  process.exit(1);
}
console.log(`\n[validate:wcx] all ${files.length} factory presets OK.`);
