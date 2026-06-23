#!/usr/bin/env node
// WGSL validation gate (build plan §24.2).
//
// Every shader must pass `naga --validate` AND translate to Metal (`naga <in> <out.metal>`).
// If naga is not installed the script prints install instructions and exits non-zero
// (unless METEOR_SKIP_WGSL=1, used for environments without a Rust toolchain).

import { execFileSync, execSync } from 'node:child_process';
import { readdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const shaderDir = resolve(here, '..', 'src', 'engine', 'shaders');

function nagaBin() {
  for (const c of ['naga', `${process.env.HOME}/.cargo/bin/naga`]) {
    try {
      execSync(`${c} --version`, { stdio: 'ignore' });
      return c;
    } catch {}
  }
  return null;
}

const naga = nagaBin();
if (!naga) {
  const msg = 'naga not found. Install with: cargo install naga-cli';
  if (process.env.METEOR_SKIP_WGSL === '1') {
    console.warn(`[validate:wgsl] SKIPPED — ${msg}`);
    process.exit(0);
  }
  console.error(`[validate:wgsl] ${msg}\n(Set METEOR_SKIP_WGSL=1 to bypass.)`);
  process.exit(1);
}

const shaders = readdirSync(shaderDir).filter((f) => f.endsWith('.wgsl'));
// common.wgsl is an include fragment (definitions only). It is prepended to every
// other shader at runtime (ShaderSourceManifest) and here, mirroring that.
const common = readFileSync(join(shaderDir, 'common.wgsl'), 'utf8');
let failed = 0;
const tmp = mkdtempSync(join(tmpdir(), 'meteor-wgsl-'));

for (const file of shaders) {
  const isCommon = file === 'common.wgsl';
  const source = isCommon
    ? common
    : common + '\n' + readFileSync(join(shaderDir, file), 'utf8');
  const combined = join(tmp, isCommon ? file : `combined_${file}`);
  writeFileSync(combined, source);

  try {
    // Passing only an input file runs parse + full validation, no output emitted.
    execFileSync(naga, [combined], { stdio: 'pipe' });
  } catch (e) {
    console.error(`✗ validate  ${file}\n${e.stderr?.toString() || e.message}`);
    failed++;
    continue;
  }
  // common.wgsl has no entry points -> validate only, skip metal emit.
  if (isCommon) {
    console.log(`✓ validate  ${file} (include fragment; metal skipped)`);
    continue;
  }
  try {
    execFileSync(
      naga,
      ['--metal-version', '2.1', combined, join(tmp, file.replace('.wgsl', '.metal'))],
      { stdio: 'pipe' }
    );
    console.log(`✓ validate+metal  ${file}`);
  } catch (e) {
    console.error(`✗ metal     ${file}\n${e.stderr?.toString() || e.message}`);
    failed++;
  }
}

rmSync(tmp, { recursive: true, force: true });
if (failed) {
  console.error(`\n[validate:wgsl] ${failed} shader check(s) failed.`);
  process.exit(1);
}
console.log(`\n[validate:wgsl] all ${shaders.length} shaders OK.`);
