// tune.js — standalone wet-shader tuning harness (NOT the editor; that's app.html).
// Renders the real MeteorEngine over a synthetic plate that is DARK on the left
// half and LIGHT on the right, with the ground laid out in PERSPECTIVE, so the
// wet look can be judged over both albedos at once. Live sliders drive the look
// parameters. Mobile-first; deployed as the site root for easy on-device tuning.
import { MeteorEngine } from '../engine/index.js';
import { BrowserHost } from './BrowserHost.js';
import { loadShaderSources } from './ShaderSourceManifest.js';
import { loadMicroNormal, loadImageBitmap } from './BrowserAssetLoader.js';

const MICRO_URL = `${import.meta.env.BASE_URL}assets/normals/wet-micro-normal.png`;
const FRAME_RATE = 30;
// Long loop so the rain stays continuous for minutes before it wraps. The field
// spreads poolSize*density impacts across this span (it is pool-based, not
// rate-based), so a big pool over a long span = steady dense rain that doesn't
// "run out".
const DURATION = 1800;

const dom = {
  canvas: document.getElementById('gpu-canvas'),
  unsupported: document.getElementById('unsupported'),
  sliders: document.getElementById('sliders'),
  fps: document.getElementById('fps'),
  play: document.getElementById('play'),
  reset: document.getElementById('reset'),
  panel: document.getElementById('panel'),
  toggle: document.getElementById('panel-toggle'),
  loadPlate: document.getElementById('load-plate'),
  loadSky: document.getElementById('load-sky'),
  filePlate: document.getElementById('file-plate'),
  fileSky: document.getElementById('file-sky'),
};

// ---- look parameters exposed as sliders (all NON-history params => no sim reset,
//      so dragging stays smooth). `density` is special-cased (rebuilds the field). ----
const CONTROLS = [
  { id: 'wetDarkening', label: 'Wet darkening', min: 0, max: 1.5, step: 0.01, def: 0.75 },
  { id: 'saturationShift', label: 'Saturation', min: -1, max: 1, step: 0.01, def: 0.25 },
  { id: 'specularGain', label: 'Reflection gain', min: 0, max: 4, step: 0.01, def: 1.4 },
  { id: 'specularWidth', label: 'Reflection spread', min: 0.01, max: 2, step: 0.01, def: 0.4 },
  { id: 'specularDirection', label: 'Light angle', min: -3.14, max: 3.14, step: 0.01, def: 0.7 },
  { id: 'poolHighlight', label: 'Pooling', min: 0, max: 2, step: 0.01, def: 0.7 },
  { id: 'rippleNormalStrength', label: 'Ripple rings', min: 0, max: 2, step: 0.01, def: 1.0 },
  { id: 'microNormalStrength', label: 'Micro breakup', min: 0, max: 2, step: 0.01, def: 0.35 },
  { id: 'distortion', label: 'Refraction', min: 0, max: 2, step: 0.01, def: 0.5 },
  { id: 'visualGain', label: 'Overall gain', min: 0, max: 4, step: 0.01, def: 1 },
  { id: 'splashWidth', label: 'Splash size', min: 0, max: 6, step: 0.01, def: 0.7 },
  { id: 'splashHeight', label: 'Crown height', min: 0, max: 6, step: 0.01, def: 0.8 },
  { id: 'dropletScale', label: 'Droplet scale', min: 0, max: 6, step: 0.01, def: 1.6 },
  { id: 'spread', label: 'Spray spread', min: 0, max: 4, step: 0.01, def: 1.4 },
  { id: 'density', label: 'Rain density', min: 0, max: 1, step: 0.01, def: 0.5 },
];

const overrides = {};
for (const c of CONTROLS) overrides[c.id] = c.def;

// ---- synthetic plate: dark-left / light-right ground in front of a dark sky,
//      with a couple of soft vertical reflected-light streaks. ----
async function makePlate() {
  const W = 1280, H = 720;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const horizon = H * 0.42;

  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#080a10'); sky.addColorStop(1, '#171b24');
  g.fillStyle = sky; g.fillRect(0, 0, W, horizon);

  g.fillStyle = '#1b1b1f'; g.fillRect(0, horizon, W / 2, H);          // dark asphalt (left)
  g.fillStyle = '#a8a59d'; g.fillRect(W / 2, horizon, W / 2, H);      // light concrete (right)
  g.fillStyle = 'rgba(60,68,84,0.7)'; g.fillRect(0, horizon - 2, W, 4); // horizon line

  // soft vertical "reflected light" streaks (something for the wet film to mirror)
  const streak = (x, w, col) => {
    const grd = g.createLinearGradient(x - w, 0, x + w, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - w, horizon, 2 * w, H - horizon);
  };
  streak(W * 0.28, 42, 'rgba(150,185,230,0.55)');  // cool light over the dark side
  streak(W * 0.74, 34, 'rgba(235,195,140,0.45)');  // warm light over the light side

  // faint grain so the surface isn't flat
  const img = g.getImageData(0, horizon, W, H - horizon);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() * 16 - 8) | 0;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, horizon);

  return createImageBitmap(cv, { colorSpaceConversion: 'none' });
}

// A perspective ground quad (surface UV square -> image trapezoid: far/narrow on
// top, near/wide at the bottom). Corner order TL, TR, BR, BL matches the project
// schema's calibrationQuad. The two halves share the center edge so they tile
// into one receding ground plane split dark|light down the middle.
function groundSurface(id, name, { farL, farR, nearL, nearR }, seed) {
  const farTop = 0.60, nearBottom = 1.0; // pavement foreground of the plate
  const quad = [
    { x: farL, y: farTop },        // TL (far)
    { x: farR, y: farTop },        // TR (far)
    { x: nearR, y: nearBottom },   // BR (near)
    { x: nearL, y: nearBottom },   // BL (near)
  ];
  const maskPath = quad.map((p) => ({ u: p.x, v: p.y }));
  return {
    id, name, enabled: true, renderOrder: 0, simulationResolution: 256,
    normalDirection: -1.5708, normalScale: 0.05, materialResponseId: 'puddle-crown',
    maskPath, calibrationQuad: quad,
    flow: { baseFlow: { x: 0, y: 0.35 }, bias: { x: 0, y: 0 } },
    reliefLayers: [],
    rainFields: [{
      id: `${id}-rain`, name: `${name} rain`, enabled: true, surfaceId: id,
      placementSeed: seed, responseSeed: seed + 7,
      centerUV: { u: 0.5, v: 0.5 }, scaleUV: { x: 0.48, y: 0.48 }, rotation: 0,
      density: overrides.density, falloff: 0.2, ratePerSecond: 40,
      startFrame: 0, endFrame: DURATION,
      // small drops, big pool spread over the long span => dense, tiny, continuous
      // rain impacts (the reference look) that don't run out.
      dropSizeRange: [0.25, 0.7], velocityRange: [0.6, 1.4], incomingDirection: -1.5708,
      paletteId: 'rain', poolSize: 3000,
    }],
  };
}

function buildProject() {
  return {
    schemaVersion: 1, projectId: 'tune-wet', durationFrames: DURATION, frameRate: FRAME_RATE,
    globalSeed: 1337,
    sourcePlate: { assetId: 'synthetic/tune', width: 1280, height: 720 },
    palettes: [{ id: 'rain', name: 'Rain', entries: [{ responseId: 'puddle-crown', weight: 1 }] }],
    surfaces: [
      // one wet-pavement surface across the plate's foreground
      groundSurface('pavement', 'Pavement', { farL: 0.0, farR: 1.0, nearL: 0.0, nearR: 1.0 }, 11),
    ],
    heroEvents: [], selectedIds: [], viewportState: { zoom: 1, panX: 0, panY: 0 },
  };
}

function buildSliders() {
  for (const c of CONTROLS) {
    const row = document.createElement('div'); row.className = 'slider';
    const label = document.createElement('label'); label.textContent = c.label;
    const input = document.createElement('input');
    input.type = 'range'; input.min = c.min; input.max = c.max; input.step = c.step; input.value = c.def;
    const out = document.createElement('output'); out.textContent = fmt(c.def);
    input.addEventListener('input', () => {
      const v = Number(input.value); out.textContent = fmt(v); overrides[c.id] = v;
      if (c.id === 'density') densityDirty = true;
    });
    row.append(label, input, out);
    dom.sliders.appendChild(row);
    c._input = input; c._out = out;
  }
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : Number(v).toFixed(2));

let engine, host, plate, project;
let playing = true, paused = 0, t0 = 0, densityDirty = false, lastCompile = 0;
let frames = 0, fpsT = 0;

async function start() {
  buildSliders();
  if (!BrowserHost.isSupported()) { dom.unsupported.hidden = false; return; }
  try {
    host = new BrowserHost(dom.canvas);
    await host.init();
    engine = await MeteorEngine.create({
      device: host.device, queue: host.queue, outputFormat: host.format,
      shaderSources: loadShaderSources(),
    });
    engine.registerAssets({ microNormal: await loadMicroNormal(host.device, MICRO_URL) });
    // Default to the real demo plate (Tesla on a pavement at sunset). The puddle
    // reflects the SAME image by default, so it mirrors that sunset sky until the
    // user loads a dedicated sky via "Load sky/env". Falls back to a synthetic
    // dark/light plate if the asset can't be fetched.
    let plateBmp;
    try { plateBmp = await loadImageBitmap(`${import.meta.env.BASE_URL}assets/demo/tesla-model3.png`); }
    catch { plateBmp = await makePlate(); }
    plate = uploadPlate(host.device, plateBmp);
    engine.registerAssets({ environment: uploadPlate(host.device, plateBmp) });
    project = buildProject();
    engine.setProject(project);
    engine.setParameters(overrides);
    wireControls();
    t0 = performance.now();
    requestAnimationFrame(loop);
  } catch (e) {
    dom.unsupported.hidden = false;
    dom.unsupported.querySelector('p').textContent = `${e?.name || 'Error'}: ${e?.message || e}`;
    if (typeof console !== 'undefined') console.error('[tune] startup failed:', e);
  }
}

function uploadPlate(device, bmp) {
  const tex = device.createTexture({
    label: 'tune-plate', size: { width: bmp.width, height: bmp.height }, format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source: bmp }, { texture: tex }, { width: bmp.width, height: bmp.height });
  return tex;
}

function wireControls() {
  dom.play.addEventListener('click', () => {
    playing = !playing;
    dom.play.textContent = playing ? '⏸ Pause' : '▶ Play';
    if (playing) t0 = performance.now() - paused; // resume where we left off
  });
  dom.reset.addEventListener('click', () => {
    for (const c of CONTROLS) {
      overrides[c.id] = c.def; c._input.value = c.def; c._out.textContent = fmt(c.def);
    }
    densityDirty = true;
  });
  dom.toggle.addEventListener('click', () => dom.panel.classList.toggle('hidden'));

  // Load a real ground plate / sky image on-device and tune against it.
  dom.loadPlate.addEventListener('click', () => dom.filePlate.click());
  dom.loadSky.addEventListener('click', () => dom.fileSky.click());
  dom.filePlate.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const bmp = await createImageBitmap(f, { colorSpaceConversion: 'none' });
    plate = uploadPlate(host.device, bmp);
  });
  dom.fileSky.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const bmp = await createImageBitmap(f, { colorSpaceConversion: 'none' });
    engine.registerAssets({ environment: uploadPlate(host.device, bmp) });
  });
}

function loop(now) {
  requestAnimationFrame(loop);
  if (!engine) return;

  if (host.resizeToDisplay()) {
    engine.resize({ width: host.canvas.width, height: host.canvas.height, pixelAspect: 1 });
  } else {
    engine.resize({ width: host.canvas.width, height: host.canvas.height, pixelAspect: 1 });
  }

  if (playing) paused = now - t0;
  const frameIndex = Math.floor((paused / 1000) * FRAME_RATE) % DURATION;

  // density edits rebuild the field (throttled so dragging stays smooth)
  if (densityDirty && now - lastCompile > 120) {
    for (const s of project.surfaces) for (const f of s.rainFields) f.density = overrides.density;
    engine.setProject(project);
    densityDirty = false; lastCompile = now;
  }
  engine.setParameters(overrides);

  engine.render({
    inputTextureView: plate.createView(),
    outputTextureView: host.currentOutputView(),
    width: host.canvas.width, height: host.canvas.height, pixelAspect: 1,
    frameIndex, timeSeconds: frameIndex / FRAME_RATE, frameRate: FRAME_RATE, debugMode: 0,
  });

  frames++;
  if (now - fpsT > 500) {
    dom.fps.textContent = `${Math.round((frames * 1000) / (now - fpsT))} fps · f${frameIndex}`;
    frames = 0; fpsT = now;
  }
}

start();
