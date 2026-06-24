// headless-render.mjs — drive the REAL MeteorEngine against the REAL Dawn/Tint
// device (node-webgpu), exactly as the browser AppController does, but headless.
// Captures pipeline-creation + render validation errors that naga can't see and
// that cascade in-browser into "Invalid RenderPipeline" noise.
//
// Requires the Dawn binding (not a hard dependency — it ships prebuilt native
// binaries and may not install on every platform):  npm i -D @kmamal/gpu
// Run with vite-node so the engine's JSON imports resolve:
//   node_modules/.bin/vite-node scripts/headless-render.mjs [project.meteor.json]
import gpu from '@kmamal/gpu';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { MeteorEngine } from '../src/engine/MeteorEngine.js';

const here = dirname(fileURLToPath(import.meta.url));
const shaderDir = resolve(here, '..', 'src', 'engine', 'shaders');
const projDir = resolve(here, '..', 'src', 'client', 'projects');
const projFiles = process.argv[2]
  ? [resolve(process.argv[2])]
  : readdirSync(projDir).filter((f) => f.endsWith('.meteor.json')).map((f) => join(projDir, f));

// WebGPU global namespace objects the engine references (browser provides these).
globalThis.GPUBufferUsage = gpu.GPUBufferUsage;
globalThis.GPUTextureUsage = gpu.GPUTextureUsage;
globalThis.GPUShaderStage = gpu.GPUShaderStage ?? { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };

function loadShaderSources() {
  const out = {};
  for (const f of readdirSync(shaderDir)) {
    if (f.endsWith('.wgsl')) out[f] = readFileSync(join(shaderDir, f), 'utf8');
  }
  return out;
}

// This Dawn build's createView() always emits a swizzle descriptor that needs the
// TextureComponentSwizzle feature (guarded by the allow_unsafe_apis toggle) — an
// env artifact of node-webgpu, NOT the app. Enable the toggle + feature so we can
// exercise the real render path.
const instance = gpu.create(['enable-dawn-features=allow_unsafe_apis']);
const adapter = await instance.requestAdapter();
let device;
for (const reqs of [['texture-component-swizzle'], []]) {
  try { device = await adapter.requestDevice({ requiredFeatures: reqs });
    console.log('device features requested:', JSON.stringify(reqs)); break; }
  catch (e) { console.log('requestDevice', JSON.stringify(reqs), 'failed:', e.message); }
}

const errors = [];
device.addEventListener?.('uncapturederror', (e) => errors.push('[uncaptured] ' + e.error.message));
const diagnostics = [];

const W = 512, H = 512;
const OUTPUT_FORMAT = 'bgra8unorm';

// real assets/textures (shared across projects)
const micro = device.createTexture({
  size: { width: 4, height: 4 }, format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});
const inputTex = device.createTexture({
  size: { width: W, height: H }, format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
});
const outputTex = device.createTexture({
  size: { width: W, height: H }, format: OUTPUT_FORMAT,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
});

device.pushErrorScope('validation');
const engine = await MeteorEngine.create({
  device, queue: device.queue, outputFormat: OUTPUT_FORMAT,
  shaderSources: loadShaderSources(),
  diagnostics: (d) => { diagnostics.push(d); },
});
const initErr = await device.popErrorScope();
if (initErr) errors.push('[init] ' + initErr.message);
engine.registerAssets({ microNormal: micro });
engine.resize({ width: W, height: H, pixelAspect: 1 });

// frame schedule: 0 (init), early, mid (rain active), late + a debug-view frame.
const FRAMES = [
  { f: 0, dbg: 0 }, { f: 1, dbg: 0 }, { f: 30, dbg: 0 },
  { f: 90, dbg: 0 }, { f: 150, dbg: 3 }, { f: 200, dbg: 5 },
];

for (const projPath of projFiles) {
  const project = JSON.parse(readFileSync(projPath, 'utf8'));
  console.log(`\nproject: ${project.projectId}  (${W}x${H}, out=${OUTPUT_FORMAT})`);

  device.pushErrorScope('validation');
  engine.setProject(project);
  engine.resetSimulation({});
  const compileErr = await device.popErrorScope();
  if (compileErr) errors.push(`[${project.projectId} setProject] ` + compileErr.message);

  for (const { f, dbg } of FRAMES) {
    device.pushErrorScope('validation');
    engine.render({
      inputTextureView: inputTex.createView(),
      outputTextureView: outputTex.createView(),
      width: W, height: H, pixelAspect: 1,
      frameIndex: f, timeSeconds: f / 30,
      frameRate: 30, debugMode: dbg,
    });
    await device.queue.onSubmittedWorkDone();
    const val = await device.popErrorScope();
    if (val) errors.push(`[${project.projectId} f${f} dbg${dbg}] ` + val.message);
  }
}

console.log('\n--- diagnostics emitted by engine ---');
for (const d of diagnostics) console.log(`  ${d.level}/${d.stage}: ${d.message}`);
if (!diagnostics.length) console.log('  (none)');

console.log('\n--- WebGPU validation errors ---');
for (const e of errors) console.log('  ' + e);
if (!errors.length) console.log('  (none)');

process.exit(errors.filter((e) => !e.includes('warn')).length ? 1 : 0);
