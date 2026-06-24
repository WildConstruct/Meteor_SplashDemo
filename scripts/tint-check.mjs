// tint-check.mjs — compile every WGSL shader against the REAL Dawn/Tint compiler
// (via node-webgpu), exactly as MeteorEngine._init does (common.wgsl prepended).
// This reproduces the shader-compilation errors Chrome reports at runtime, which
// naga (the CI gate) does not catch.
//
// Requires the Dawn binding (not a hard dependency — it ships prebuilt native
// binaries and may not install on every platform):  npm i -D @kmamal/gpu
// Run with vite-node so the engine's JSON imports resolve:
//   node_modules/.bin/vite-node scripts/tint-check.mjs
import gpu from '@kmamal/gpu';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shaderDir = resolve(here, '..', 'src', 'engine', 'shaders');

// The 8 modules the browser engine actually compiles (MeteorEngine.SHADER_FILES),
// plus the Dawn-only set, so we cover everything. common.wgsl is the include.
const all = readdirSync(shaderDir).filter((f) => f.endsWith('.wgsl') && f !== 'common.wgsl');
const common = readFileSync(join(shaderDir, 'common.wgsl'), 'utf8');

const instance = gpu.create([]);
const adapter = await instance.requestAdapter();
if (!adapter) { console.error('no adapter'); process.exit(2); }
const device = await adapter.requestDevice();
console.log('adapter:', adapter.info?.vendor, adapter.info?.architecture, adapter.info?.description);

let failed = 0;
for (const file of all) {
  const code = common + '\n' + readFileSync(join(shaderDir, file), 'utf8');
  device.pushErrorScope('validation');
  const mod = device.createShaderModule({ label: file, code });
  const info = await mod.getCompilationInfo();
  const err = await device.popErrorScope();
  const msgs = info.messages.filter((m) => m.type === 'error' || m.type === 'warning');
  if (msgs.length === 0 && !err) {
    console.log(`OK    ${file}`);
    continue;
  }
  failed++;
  console.log(`FAIL  ${file}`);
  for (const m of info.messages) {
    if (m.type === 'info') continue;
    console.log(`   [${m.type}] line ${m.lineNum}:${m.linePos}  ${m.message}`);
  }
  if (err) console.log(`   [scope] ${err.message}`);
}
console.log(`\n${failed} shader(s) failed Tint compilation.`);
process.exit(failed ? 1 : 0);
