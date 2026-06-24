// render-png.mjs — render real Meteor frames headlessly (Dawn/Tint) and read the
// pixels back to PNG, so the wet-shader output can be inspected without a browser.
// Uses a synthetic mid-gray plate with light structure so effect SCALE (splash
// size, rain density, wet streaks, pooling) is judged on its own merits.
//   node_modules/.bin/vite-node scripts/render-png.mjs
import gpu from '@kmamal/gpu';
import zlib from 'node:zlib';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { MeteorEngine } from '../src/engine/MeteorEngine.js';

const here = dirname(fileURLToPath(import.meta.url));
const shaderDir = resolve(here, '..', 'src', 'engine', 'shaders');
const outDir = resolve(here, '..', 'tmp-renders');
try { readdirSync(outDir); } catch { (await import('node:fs')).mkdirSync(outDir, { recursive: true }); }

globalThis.GPUBufferUsage = gpu.GPUBufferUsage;
globalThis.GPUTextureUsage = gpu.GPUTextureUsage;
globalThis.GPUShaderStage = gpu.GPUShaderStage ?? { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };

const loadShaders = () => {
  const out = {};
  for (const f of readdirSync(shaderDir)) if (f.endsWith('.wgsl')) out[f] = readFileSync(join(shaderDir, f), 'utf8');
  return out;
};

function writePNG(path, w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy ? rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
              : raw.set(rgba.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0, 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  writeFileSync(path, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

const instance = gpu.create(['enable-dawn-features=allow_unsafe_apis']);
const adapter = await instance.requestAdapter();
const device = await adapter.requestDevice({ requiredFeatures: ['texture-component-swizzle'] });

const W = 768, H = 432;
const FORMAT = 'bgra8unorm';
const engine = await MeteorEngine.create({
  device, queue: device.queue, outputFormat: FORMAT, shaderSources: loadShaders(),
});
const micro = device.createTexture({ size: { width: 4, height: 4 }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
engine.registerAssets({ microNormal: micro });
engine.resize({ width: W, height: H, pixelAspect: 1 });

// synthetic plate: dark asphalt base with a couple of soft bright vertical
// streaks (mimicking reflected light/sky from the reference photos) so wet
// darkening, sheen and ripple reflections read representatively.
const plate = device.createTexture({ size: { width: W, height: H }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
{
  const bpr = Math.ceil((W * 4) / 256) * 256;
  const buf = new Uint8Array(bpr * H);
  const streak = (x, cx, wd, amp) => amp * Math.exp(-((x - cx) * (x - cx)) / (2 * wd * wd));
  const horizon = H * 0.42;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let base;
    if (y < horizon) base = 12 + 16 * (y / horizon);          // dark sky
    else base = (x < W / 2) ? 27 : 168;                       // dark asphalt | light concrete
    let v = base;
    v += streak(x, W * 0.28, W * 0.05, 90);                   // cool reflected light (dark side)
    v += streak(x, W * 0.74, W * 0.045, 55);                  // warm reflected light (light side)
    v += (((x * 13 + y * 7) % 17) - 8) * 0.6;                 // faint grain
    const r = Math.max(0, Math.min(255, v + streak(x, W * 0.74, W * 0.045, 25)));
    const g = Math.max(0, Math.min(255, v));
    const b = Math.max(0, Math.min(255, v + streak(x, W * 0.28, W * 0.05, 20)));
    const o = y * bpr + x * 4; buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
  }
  device.queue.writeTexture({ texture: plate }, buf, { bytesPerRow: bpr, rowsPerImage: H }, { width: W, height: H });
  const sp = (u, v) => { const x = Math.floor(u * W), y = Math.floor(v * H), o = y * bpr + x * 4; return `${buf[o]},${buf[o + 1]},${buf[o + 2]}`; };
  console.log(`plate src  gap(0.50,0.55)=${sp(0.50, 0.55)}  mask(0.25,0.55)=${sp(0.25, 0.55)}  streak(0.30,0.55)=${sp(0.30, 0.55)}`);
}

const project = JSON.parse(readFileSync(resolve(here, '..', 'src', 'client', 'projects', 'hard-surface-topdown.meteor.json'), 'utf8'));
if (process.env.EMPTY) { project.surfaces = []; console.log('EMPTY: no surfaces (linearize + encode only)'); }
engine.setProject(project);

const output = device.createTexture({ size: { width: W, height: H }, format: FORMAT, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING });
const bpr = Math.ceil((W * 4) / 256) * 256;
const readBuf = device.createBuffer({ size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

async function frameToPng(frameIndex, dbg, name) {
  engine.render({
    inputTextureView: plate.createView(), outputTextureView: output.createView(),
    width: W, height: H, pixelAspect: 1, frameIndex, timeSeconds: frameIndex / 30, frameRate: 30, debugMode: dbg,
  });
  const enc = device.createCommandEncoder();
  enc.copyTextureToBuffer({ texture: output }, { buffer: readBuf, bytesPerRow: bpr, rowsPerImage: H }, { width: W, height: H });
  device.queue.submit([enc.finish()]);
  await readBuf.mapAsync(gpu.GPUMapMode.READ);
  const mapped = new Uint8Array(readBuf.getMappedRange());
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = y * bpr + x * 4, d = (y * W + x) * 4;
    rgba[d] = mapped[s + 2]; rgba[d + 1] = mapped[s + 1]; rgba[d + 2] = mapped[s]; rgba[d + 3] = mapped[s + 3]; // BGRA->RGBA
  }
  readBuf.unmap();
  // quick stats: mean luminance + sample an unmasked gap (u~0.5) vs inside the
  // left asphalt mask (u~0.25). Helps diagnose exposure without eyeballing.
  let sum = 0;
  for (let i = 0; i < rgba.length; i += 4) sum += rgba[i] + rgba[i + 1] + rgba[i + 2];
  const mean = (sum / (W * H * 3)).toFixed(1);
  const at = (u, v) => { const x = Math.floor(u * W), y = Math.floor(v * H), o = (y * W + x) * 4; return `${rgba[o]},${rgba[o + 1]},${rgba[o + 2]}`; };
  const path = join(outDir, name);
  writePNG(path, W, H, rgba);
  console.log(`wrote ${name} mean=${mean} topMargin(0.50,0.02)=${at(0.50, 0.02)} leftEdge(0.02,0.50)=${at(0.02, 0.50)} gap(0.50,0.55)=${at(0.50, 0.55)} mask(0.25,0.55)=${at(0.25, 0.55)}`);
}

await frameToPng(0, 0, 'beauty-f0.png');
await frameToPng(160, 0, 'beauty-f160.png');
await frameToPng(60, 0, 'beauty-f60.png');
process.exit(0);
