#!/usr/bin/env node
// Generates bundled demo assets (build plan §6 public/assets). The plate is a
// SYNTHETIC stand-in for a real car-and-ground photo (no photo ships in this
// repo). Replace public/assets/demo/car-hood-demo.png with a real plate anytime;
// the app also supports image upload.
//
// Produces:
//   public/assets/demo/car-hood-demo.png   1920x1080 synthetic scene
//   public/assets/normals/wet-micro-normal.png  256x256 tiling normal noise
//   public/assets/splashes/splash-atlas.png + .json  4 analytic crown sprites

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// ---- minimal PNG encoder (RGBA8, filter 0) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // filtered scanlines (filter byte 0 per row)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp8(v) { return Math.max(0, Math.min(255, Math.round(v))); }

// cheap value noise
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(a, b, t) { const s = t * t * (3 - 2 * t); return a + (b - a) * s; }
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const n00 = hash2(xi, yi), n10 = hash2(xi + 1, yi);
  const n01 = hash2(xi, yi + 1), n11 = hash2(xi + 1, yi + 1);
  return smooth(smooth(n00, n10, xf), smooth(n01, n11, xf), yf);
}

// ---- plate ----
function makePlate(W, H) {
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let r, g, b;
      // sky gradient (top)
      const sky = [60 + 40 * (1 - v), 80 + 50 * (1 - v), 110 + 60 * (1 - v)];
      // ground (bottom, below v=0.65)
      const ground = [40 + 15 * noise(u * 40, v * 40), 42 + 15 * noise(u * 40 + 5, v * 40), 46 + 18 * noise(u * 40, v * 40 + 5)];
      const groundMix = smoothstep(0.62, 0.72, v);
      r = sky[0] * (1 - groundMix) + ground[0] * groundMix;
      g = sky[1] * (1 - groundMix) + ground[1] * groundMix;
      b = sky[2] * (1 - groundMix) + ground[2] * groundMix;

      // car body: rounded dark shape, hood region v in [0.4,0.62], u in [0.22,0.78]
      const inHood = u > 0.22 + (0.62 - v) * 0.0 && u < 0.78 && v > 0.40 && v < 0.62;
      const hoodShape = insideTrapezoid(u, v, 0.30, 0.70, 0.22, 0.78, 0.40, 0.62);
      if (hoodShape) {
        // glossy dark red car paint
        const sheen = 0.5 + 0.5 * Math.cos((u - 0.5) * 6.0) * (1 - (v - 0.4) / 0.22);
        r = 120 + 60 * sheen;
        g = 30 + 20 * sheen;
        b = 35 + 25 * sheen;
        // intake ellipse darker (center 0.5,0.42)
        const dx = (u - 0.5) / 0.16, dy = (v - 0.42) / 0.08;
        if (dx * dx + dy * dy < 1) {
          const k = 1 - (dx * dx + dy * dy);
          r *= 0.45 + 0.2 * k; g *= 0.45; b *= 0.45;
        }
      }
      // windshield above hood
      if (v < 0.40 && v > 0.28 && u > 0.32 && u < 0.68) {
        r = 25 + 20 * noise(u * 60, v * 60); g = 30 + 25 * noise(u * 60, v * 60); b = 45 + 30 * noise(u * 60, v * 60);
      }
      const i = (y * W + x) * 4;
      buf[i] = clamp8(r); buf[i + 1] = clamp8(g); buf[i + 2] = clamp8(b); buf[i + 3] = 255;
    }
  }
  return buf;
}
function smoothstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function insideTrapezoid(u, v, topL, topR, botL, botR, top, bot) {
  if (v < top || v > bot) return false;
  const t = (v - top) / (bot - top);
  const l = topL + (botL - topL) * t;
  const r = topR + (botR - topR) * t;
  return u > l && u < r;
}

// ---- micro normal (tiling) ----
function makeMicroNormal(S) {
  const buf = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const h = (xx, yy) => noise((xx % S) / S * 8, (yy % S) / S * 8);
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx * 2, ny = -dy * 2, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * S + x) * 4;
      buf[i] = clamp8((nx / len * 0.5 + 0.5) * 255);
      buf[i + 1] = clamp8((ny / len * 0.5 + 0.5) * 255);
      buf[i + 2] = clamp8((nz / len * 0.5 + 0.5) * 255);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

// ---- splash atlas (4 crown sprites in a 2x2 grid) ----
function makeSplashAtlas(S) {
  const buf = Buffer.alloc(S * S * 4);
  const cell = S / 2;
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const idx = gy * 2 + gx;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const u = (x / cell) * 2 - 1, v = (y / cell) * 2 - 1;
          const r = Math.hypot(u, v);
          // ring + spokes, more spokes for higher-index responses
          const ring = Math.exp(-Math.pow((r - 0.6) / 0.18, 2));
          const spokes = 0.5 + 0.5 * Math.cos(Math.atan2(v, u) * (6 + idx * 2));
          const a = Math.min(1, ring * (0.5 + 0.5 * spokes));
          const px = ((gy * cell + y) * S + (gx * cell + x)) * 4;
          buf[px] = 230; buf[px + 1] = 240; buf[px + 2] = 255; buf[px + 3] = clamp8(a * 255);
        }
      }
    }
  }
  return buf;
}

// ---- write ----
const demoDir = join(root, 'public', 'assets', 'demo');
const normDir = join(root, 'public', 'assets', 'normals');
const splashDir = join(root, 'public', 'assets', 'splashes');
mkdirSync(demoDir, { recursive: true });
mkdirSync(normDir, { recursive: true });
mkdirSync(splashDir, { recursive: true });

console.log('rendering plate 1920x1080…');
writeFileSync(join(demoDir, 'car-hood-demo.png'), encodePNG(1920, 1080, makePlate(1920, 1080)));
console.log('rendering micro-normal 256…');
writeFileSync(join(normDir, 'wet-micro-normal.png'), encodePNG(256, 256, makeMicroNormal(256)));
console.log('rendering splash atlas 512…');
writeFileSync(join(splashDir, 'splash-atlas.png'), encodePNG(512, 512, makeSplashAtlas(512)));
writeFileSync(join(splashDir, 'splash-atlas.json'), JSON.stringify({
  size: 512, cell: 256, grid: [2, 2],
  entries: [
    { id: 'metal-tick', rect: [0, 0, 256, 256] },
    { id: 'metal-bounce', rect: [256, 0, 256, 256] },
    { id: 'puddle-crown', rect: [0, 256, 256, 256] },
    { id: 'hero-splash', rect: [256, 256, 256, 256] },
  ],
}, null, 2) + '\n');
console.log('done.');
