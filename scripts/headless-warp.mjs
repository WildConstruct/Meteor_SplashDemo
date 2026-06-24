// headless-warp.mjs — render a WARPED (sliced + bent) surface against real Dawn
// to validate the mesh-warp composite path (vertex buffers, drawIndexed, the
// vs_warp/fs_warp pipeline) that naga can't fully check.
//   node_modules/.bin/vite-node scripts/headless-warp.mjs
import gpu from '@kmamal/gpu';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { MeteorEngine } from '../src/engine/MeteorEngine.js';
import { warpFromQuad, addSlice } from '../src/engine/geometry/SurfaceWarp.js';

const here = dirname(fileURLToPath(import.meta.url));
const shaderDir = resolve(here, '..', 'src', 'engine', 'shaders');
const projPath = resolve(here, '..', 'src', 'client', 'projects', 'car-hood-demo.meteor.json');

globalThis.GPUBufferUsage = gpu.GPUBufferUsage;
globalThis.GPUTextureUsage = gpu.GPUTextureUsage;
globalThis.GPUShaderStage = gpu.GPUShaderStage ?? { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };

const loadShaderSources = () => {
  const out = {};
  for (const f of readdirSync(shaderDir)) if (f.endsWith('.wgsl')) out[f] = readFileSync(join(shaderDir, f), 'utf8');
  return out;
};

const instance = gpu.create(['enable-dawn-features=allow_unsafe_apis']);
const adapter = await instance.requestAdapter();
let device;
for (const reqs of [['texture-component-swizzle'], []]) {
  try { device = await adapter.requestDevice({ requiredFeatures: reqs }); break; } catch {}
}

const errors = [];
const W = 512, H = 512, OUTPUT_FORMAT = 'bgra8unorm';
const micro = device.createTexture({ size: { width: 4, height: 4 }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
const inputTex = device.createTexture({ size: { width: W, height: H }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
const outputTex = device.createTexture({ size: { width: W, height: H }, format: OUTPUT_FORMAT, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING });

device.pushErrorScope('validation');
const engine = await MeteorEngine.create({ device, queue: device.queue, outputFormat: OUTPUT_FORMAT, shaderSources: loadShaderSources(), diagnostics: () => {} });
const initErr = await device.popErrorScope();
if (initErr) errors.push('[init] ' + initErr.message);
engine.registerAssets({ microNormal: micro });
engine.resize({ width: W, height: H, pixelAspect: 1 });

// Take the hood surface and bend its front section down (a slice at v=0.6).
const project = JSON.parse(readFileSync(projPath, 'utf8'));
const s = project.surfaces[0];
let warp = addSlice(warpFromQuad(s.calibrationQuad), 0.6);
warp.grid[1][0].v += 0.08; warp.grid[1][1].v += 0.08; // bend the slice row down
warp.grid[2][0].v += 0.16; warp.grid[2][1].v += 0.16; // and the near edge further
warp.blend = 0.5;
s.warp = warp;
// tilt the plane toward vertical + drive drips from that tilt (no manual amount)
s.worldNormal = { x: 0, y: 0.85, z: 0.53 };
s.drip = { amount: 0, fromTilt: 1.0, speed: 0.3, width: 0.012, meander: 0.6 };
console.log(`warped surface "${s.id}": rows=${warp.grid.length}, blend=${warp.blend}, tilt-driven drip`);

device.pushErrorScope('validation');
engine.setProject(project);
engine.resetSimulation({});
const compileErr = await device.popErrorScope();
if (compileErr) errors.push('[setProject] ' + compileErr.message);

for (const f of [0, 1, 30, 90, 150]) {
  device.pushErrorScope('validation');
  engine.render({
    inputTextureView: inputTex.createView(), outputTextureView: outputTex.createView(),
    width: W, height: H, pixelAspect: 1, frameIndex: f, timeSeconds: f / 30, frameRate: 30, debugMode: 0,
  });
  await device.queue.onSubmittedWorkDone();
  const val = await device.popErrorScope();
  if (val) errors.push(`[f${f}] ` + val.message);
}

console.log('\n--- WebGPU validation errors ---');
for (const e of errors) console.log('  ' + e);
if (!errors.length) console.log('  (none)');
process.exit(errors.length ? 1 : 0);
