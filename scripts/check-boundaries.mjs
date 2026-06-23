#!/usr/bin/env node
// Architecture boundary enforcement (build plan §6.1).
//
// Fails if anything under src/engine/ references browser-only globals or imports
// client modules. WebGPU types (GPUDevice, GPUQueue, GPUTexture, ...) ARE allowed
// inside the engine; only browser *acquisition* of those objects is forbidden.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const engineDir = join(root, 'src', 'engine');

// Forbidden identifiers as whole-word matches. GPUDevice/GPUQueue/GPUTexture are
// intentionally NOT here. GPUCanvasContext IS forbidden (canvas acquisition).
const forbidden = [
  'window',
  'document',
  'navigator',
  'HTMLCanvasElement',
  'GPUCanvasContext',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'ImageBitmap',
  'createImageBitmap',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(js|mjs|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(engineDir)) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // skip comments cheaply
    const code = line.replace(/\/\/.*$/, '');
    for (const sym of forbidden) {
      const re = new RegExp(`(^|[^.\\w])${sym}\\b`);
      if (re.test(code)) {
        violations.push(`${relative(root, file)}:${i + 1}  forbidden symbol "${sym}"`);
      }
    }
    // forbid importing from the client layer
    if (/from\s+['"].*\/client\//.test(code) || /import\s*\(\s*['"].*\/client\//.test(code)) {
      violations.push(`${relative(root, file)}:${i + 1}  engine imports a client module`);
    }
  });
}

if (violations.length) {
  console.error('Boundary check FAILED. The engine must stay host-neutral:\n');
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('Boundary check passed: src/engine/ is host-neutral.');
