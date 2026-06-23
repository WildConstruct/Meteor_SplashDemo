// MeteorEngine — host-neutral WebGPU multipass engine (build plan §8, §20).
//
// The engine RECEIVES an existing GPUDevice/GPUQueue, input + output texture
// views, explicit time/frame, parameters, and project state. It never acquires a
// device, configures a canvas, loads files, or touches the DOM. All browser work
// lives in src/client/.
//
// Frame graph (§20): linearize -> [advance wet-state per surface] ->
// [composite per surface] -> splash -> droplets -> encode.

import { TexturePool } from './gpu/TexturePool.js';
import {
  packFrame, packSurface, packImpacts, packCompositeConfig, packFlowConfig,
} from './gpu/Packing.js';
import { ParameterState } from './ParameterState.js';
import { buildSurfaceTransforms, normalProjection } from './geometry/SurfaceTransforms.js';
import { rasterizeMask } from './geometry/SurfaceMask.js';
import { rasterizeRelief } from './geometry/ReliefShapes.js';
import { buildFieldEvents, activeEvents } from './events/RainFieldScheduler.js';
import { resolveResponses } from './events/ImpactPalette.js';
import { suppressedSourceIds, applySuppression } from './events/HeroEvents.js';
import { getResponse, RESPONSE_INDEX } from './responses/response-schema.js';
import { SimulationClock } from './simulation/SimulationClock.js';
import { CheckpointCache } from './simulation/CheckpointCache.js';
import { planSeek } from './simulation/WetStateTimeline.js';
import {
  buildCacheKey, hashString, makeDiagnostic, SIM_HZ,
} from './EngineContracts.js';
import { surfaceTopologyHash } from './ProjectSchema.js';

const SHADER_FILES = [
  'plate_linearize', 'deposit_stamp', 'wet_update', 'relief_gradient',
  'flow_build', 'wet_composite', 'splash', 'droplets',
];

export class MeteorEngine {
  constructor({ device, queue, outputFormat, shaderSources, diagnostics }) {
    this.device = device;
    this.queue = queue ?? device.queue;
    this.outputFormat = outputFormat;
    this.shaderSources = shaderSources;
    this.emit = diagnostics ?? (() => {});

    this.params = new ParameterState();
    this.project = null;
    this.assets = { microNormal: null, plate: null };

    this.pool = new TexturePool(device);
    this.modules = {};
    this.pipelines = {};
    this.samplers = {};
    this.uniformBuffers = {};
    this.surfaceRuntime = new Map(); // surfaceId -> compiled per-surface gpu state
    this.cacheKey = null;
    this.currentSimStep = -1;
    this.checkpoints = new CheckpointCache({
      interval: 30,
      onEvict: (t) => t.destroy(),
    });

    this.width = 1920;
    this.height = 1080;
    this.pixelAspect = 1;
  }

  static async create(opts) {
    const engine = new MeteorEngine(opts);
    await engine._init();
    return engine;
  }

  async _init() {
    const dev = this.device;
    dev.pushErrorScope('validation');

    const common = this.shaderSources['common.wgsl'] ?? '';
    const module = (file) =>
      dev.createShaderModule({
        label: file,
        code: common + '\n' + (this.shaderSources[`${file}.wgsl`] ?? ''),
      });
    for (const f of SHADER_FILES) this.modules[f] = module(f);

    this.samplers.linear = dev.createSampler({
      magFilter: 'linear', minFilter: 'linear',
      addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
    });
    this.samplers.repeat = dev.createSampler({
      magFilter: 'linear', minFilter: 'linear',
      addressModeU: 'repeat', addressModeV: 'repeat',
    });

    // shared uniform buffers (rewritten per frame / per sim-step submit)
    const ub = (size) => dev.createBuffer({ size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.uniformBuffers.frame = ub(32);
    this.uniformBuffers.params = ub(112);
    this.uniformBuffers.composite = ub(16);

    this._createPipelines();

    const err = await dev.popErrorScope();
    if (err) this.emit(makeDiagnostic('error', 'init', err.message));
  }

  _createPipelines() {
    const dev = this.device;
    const fmtLinear = 'rgba16float';

    this.pipelines.linearize = dev.createRenderPipeline({
      layout: 'auto',
      vertex: { module: this.modules.plate_linearize, entryPoint: 'vs' },
      fragment: { module: this.modules.plate_linearize, entryPoint: 'fs', targets: [{ format: fmtLinear }] },
      primitive: { topology: 'triangle-list' },
    });

    this.pipelines.deposit = dev.createComputePipeline({
      layout: 'auto',
      compute: { module: this.modules.deposit_stamp, entryPoint: 'main' },
    });
    this.pipelines.wetUpdate = dev.createComputePipeline({
      layout: 'auto',
      compute: { module: this.modules.wet_update, entryPoint: 'main' },
    });
    this.pipelines.reliefGradient = dev.createComputePipeline({
      layout: 'auto',
      compute: { module: this.modules.relief_gradient, entryPoint: 'main' },
    });
    this.pipelines.flowBuild = dev.createComputePipeline({
      layout: 'auto',
      compute: { module: this.modules.flow_build, entryPoint: 'main' },
    });

    // composite has two pipelines: linear intermediate + final encode (output fmt)
    const compositeFor = (format) => dev.createRenderPipeline({
      layout: 'auto',
      vertex: { module: this.modules.wet_composite, entryPoint: 'vs' },
      fragment: { module: this.modules.wet_composite, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    this.pipelines.compositeLinear = compositeFor(fmtLinear);
    this.pipelines.compositeOutput = compositeFor(this.outputFormat);

    const additive = {
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    };
    this.pipelines.splash = dev.createRenderPipeline({
      layout: 'auto',
      vertex: { module: this.modules.splash, entryPoint: 'vs' },
      fragment: { module: this.modules.splash, entryPoint: 'fs', targets: [{ format: fmtLinear, blend: additive }] },
      primitive: { topology: 'triangle-list' },
    });
    this.pipelines.droplets = dev.createRenderPipeline({
      layout: 'auto',
      vertex: { module: this.modules.droplets, entryPoint: 'vs' },
      fragment: { module: this.modules.droplets, entryPoint: 'fs', targets: [{ format: fmtLinear, blend: additive }] },
      primitive: { topology: 'triangle-list' },
    });
  }

  // ---- host API ----
  setParameters(paramStateOrObject) {
    if (paramStateOrObject instanceof ParameterState) this.params = paramStateOrObject;
    else this.params.applyOverrides(paramStateOrObject);
    this._invalidateIfHistoryChanged();
  }

  setProject(project) {
    this.project = project;
    this._compileProject();
    this._invalidateIfHistoryChanged(true);
  }

  registerAssets(assets) {
    this.assets = { ...this.assets, ...assets };
  }

  resize({ width, height, pixelAspect }) {
    this.width = width;
    this.height = height;
    this.pixelAspect = pixelAspect ?? 1;
  }

  resetSimulation({ surfaceId = null } = {}) {
    this.currentSimStep = -1;
    this.checkpoints.reset(this.cacheKey);
    for (const [id, rt] of this.surfaceRuntime) {
      if (surfaceId && id !== surfaceId) continue;
      rt.simInitialized = false;
    }
  }

  dispose() {
    this.pool.destroyAll();
    this.checkpoints.reset(null);
    for (const b of Object.values(this.uniformBuffers)) b.destroy?.();
    this.surfaceRuntime.clear();
  }

  // ---- project compilation (host-neutral) ----
  _currentCacheKey() {
    if (!this.project) return 'empty';
    return buildCacheKey({
      schemaHash: hashString(String(this.project.schemaVersion)),
      topologyHash: hashString(surfaceTopologyHash(this.project)),
      paramHistoryHash: hashString(this.params.historyHash()),
      simResolution: 256,
      frameRate: this.project.frameRate,
      projectSeed: this.project.globalSeed,
    });
  }

  _invalidateIfHistoryChanged(force = false) {
    const key = this._currentCacheKey();
    if (force || key !== this.cacheKey) {
      this.cacheKey = key;
      this.resetSimulation({});
    }
  }

  _compileProject() {
    if (!this.project) return;
    const p = this.project;
    const palettes = new Map((p.palettes ?? []).map((pl) => [pl.id, pl]));
    const heroSuppressed = suppressedSourceIds(p.heroEvents ?? []);
    this.surfaceRuntime.clear();

    for (const surface of p.surfaces ?? []) {
      const transforms = buildSurfaceTransforms(surface);
      if (!transforms.valid) {
        this.emit(makeDiagnostic('warn', 'homography', `surface ${surface.id}: ${transforms.warnings.join(', ')}`));
      }
      const res = surface.simulationResolution ?? 256;

      // build all events for this surface's fields
      let events = [];
      for (const field of surface.rainFields ?? []) {
        events.push(...buildFieldEvents(field, p.globalSeed, this.params.toObject()));
      }
      events = resolveResponses(events, palettes, 'metal-tick');
      events = applySuppression(events, heroSuppressed);

      this.surfaceRuntime.set(surface.id, {
        surface,
        transforms,
        res,
        events,
        maskData: rasterizeMask(surface.maskPath ?? [], res, res),
        reliefData: rasterizeRelief(surface.reliefLayers ?? [], res, res, this.params.toObject()),
        flowConfig: surface.flow ?? { baseFlow: { x: 0, y: 0.3 }, bias: { x: 0, y: 0 } },
        simInitialized: false,
        staticUploaded: false,
        bindGroups: {},
      });
    }
  }

  /** Effective impacts (response + hero overrides baked) active at a frame. */
  _activeImpactsAt(rt, frameIndex) {
    const fr = this.project.frameRate;
    const g = this.params.toObject();
    const out = [];

    // generated
    for (const ev of rt.events) {
      const resp = getResponse(ev.responseId);
      const lifeFrames = resp.lifetime * fr * (g.lifetime ?? 1);
      if (frameIndex < ev.frame || frameIndex > ev.frame + lifeFrames) continue;
      out.push({
        surfaceUV: ev.surfaceUV,
        birthFrame: ev.frame,
        dropSize: ev.dropSize,
        responseIndex: RESPONSE_INDEX.get(ev.responseId) ?? 0,
        incomingVelocity: ev.incomingVelocity,
        responseSeed: ev.responseSeed,
        visualGain: resp.visualGain,
        heightOv: 1, widthOv: 1, bounceOv: 1, spreadOv: 1,
        lifetimeOv: lifeFrames,
        rippleImpulse: resp.rippleImpulse,
        wetnessDeposit: resp.wetnessDeposit * (g.wetnessDeposit ?? 1),
        waterDeposit: resp.waterDeposit,
      });
    }
    // hero
    for (const h of this.project.heroEvents ?? []) {
      if (!h.enabled || h.surfaceId !== rt.surface.id) continue;
      const resp = getResponse(h.responseId);
      const lifeFrames = (h.lifetimeOverride ?? resp.lifetime * fr) * (g.lifetime ?? 1);
      if (frameIndex < h.frame || frameIndex > h.frame + lifeFrames) continue;
      out.push({
        surfaceUV: h.surfaceUV,
        birthFrame: h.frame,
        dropSize: 1.4,
        responseIndex: RESPONSE_INDEX.get(h.responseId) ?? 3,
        incomingVelocity: 1,
        responseSeed: hashString(h.id) >>> 0,
        visualGain: h.visualGainOverride ?? resp.visualGain,
        heightOv: h.heightOverride ?? 1.5,
        widthOv: h.widthOverride ?? 1.3,
        bounceOv: h.bounceOverride ?? 1,
        spreadOv: h.spreadOverride ?? 1.2,
        lifetimeOv: lifeFrames,
        rippleImpulse: resp.rippleImpulse,
        wetnessDeposit: resp.wetnessDeposit * (g.wetnessDeposit ?? 1),
        waterDeposit: resp.waterDeposit,
      });
    }
    return out;
  }

  // ---- render ----
  render(args) {
    if (!this.project) {
      this.emit(makeDiagnostic('warn', 'render', 'no project set'));
      return;
    }
    try {
      this._writeFrameUniforms(args);
      this._advanceSimulation(args);
      this._renderBeauty(args);
    } catch (e) {
      this.emit(makeDiagnostic('error', 'render', e.message));
    }
  }

  _writeFrameUniforms(args) {
    this.queue.writeBuffer(this.uniformBuffers.params, 0, this._paramsPadded());
  }

  _paramsPadded() {
    const packed = this.params.packUniform(); // 25 f32
    const buf = new Float32Array(28); // pad to struct size 112 bytes
    buf.set(packed);
    return buf;
  }

  _advanceSimulation(args) {
    const clock = new SimulationClock(this.project.frameRate, SIM_HZ);
    const targetStep = clock.simStepForFrame(args.frameIndex);
    const plan = planSeek({ currentStep: this.currentSimStep, targetStep, cache: this.checkpoints });

    for (const rt of this.surfaceRuntime.values()) {
      this._ensureSurfaceTextures(rt);
    }

    let step = plan.fromStep;
    if (plan.restoreTexture) {
      for (const rt of this.surfaceRuntime.values()) this._restoreCheckpoint(rt, plan.restoreTexture);
    } else if (plan.restoreFrom === 0 && this.currentSimStep < 0) {
      for (const rt of this.surfaceRuntime.values()) this._clearState(rt);
    }

    const frInv = this.project.frameRate / SIM_HZ;
    for (let i = 0; i < plan.replaySteps; i++) {
      step += 1;
      const frameForStep = step * frInv;
      this._encodeSimStep(frameForStep);
      if (this.checkpoints.shouldCheckpoint(step)) this._storeCheckpoint(step);
    }
    this.currentSimStep = targetStep;
  }

  _encodeSimStep(frameForStep) {
    const dev = this.device;
    for (const rt of this.surfaceRuntime.values()) {
      const impacts = this._activeImpactsAt(rt, frameForStep);
      this._uploadImpacts(rt, impacts);

      // frame uniform for this step
      this.queue.writeBuffer(this.uniformBuffers.frame, 0, packFrame({
        width: rt.res, height: rt.res, pixelAspect: 1,
        timeSeconds: frameForStep / this.project.frameRate,
        frameIndex: frameForStep, globalSeed: this.project.globalSeed,
        simDt: 1 / SIM_HZ, debugMode: 0,
      }));

      const enc = dev.createCommandEncoder();
      // deposit
      {
        const pass = enc.beginComputePass();
        pass.setPipeline(this.pipelines.deposit);
        pass.setBindGroup(0, this._depositBindGroup(rt));
        pass.dispatchWorkgroups(Math.ceil(rt.res / 8), Math.ceil(rt.res / 8));
        pass.end();
      }
      // wet update (ping-pong)
      {
        const pass = enc.beginComputePass();
        pass.setPipeline(this.pipelines.wetUpdate);
        pass.setBindGroup(0, this._wetUpdateBindGroup(rt));
        pass.dispatchWorkgroups(Math.ceil(rt.res / 8), Math.ceil(rt.res / 8));
        pass.end();
      }
      this.queue.submit([enc.finish()]);
      [rt.stateA, rt.stateB] = [rt.stateB, rt.stateA];
    }
  }

  _renderBeauty(args) {
    const dev = this.device;
    const working = this.pool.acquire('working', {
      size: { width: this.width, height: this.height },
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const colorB = this.pool.acquire('colorB', {
      size: { width: this.width, height: this.height },
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    // frame uniform for beauty
    this.queue.writeBuffer(this.uniformBuffers.frame, 0, packFrame({
      width: this.width, height: this.height, pixelAspect: this.pixelAspect,
      timeSeconds: args.timeSeconds, frameIndex: args.frameIndex,
      globalSeed: this.project.globalSeed, simDt: 1 / SIM_HZ,
      debugMode: args.debugMode ?? this.params.get('debugMode'),
    }));

    const enc = dev.createCommandEncoder();

    // linearize plate -> working
    this._fullscreen(enc, working.createView(), this.pipelines.linearize,
      this._linearizeBindGroup(args.inputTextureView));

    // composite each surface, ping-pong working <-> colorB (linear)
    let src = working;
    let dst = colorB;
    for (const rt of this.surfaceRuntime.values()) {
      this.queue.writeBuffer(this.uniformBuffers.composite, 0, packCompositeConfig({ encode: 0 }));
      this._fullscreen(enc, dst.createView(), this.pipelines.compositeLinear,
        this._compositeBindGroup(rt, src.createView()));
      [src, dst] = [dst, src];
    }

    // splash + droplets (additive) onto src (current linear color)
    for (const rt of this.surfaceRuntime.values()) {
      const impacts = this._activeImpactsAt(rt, args.frameIndex);
      if (!impacts.length) continue;
      this._uploadImpacts(rt, impacts);
      this._drawInstanced(enc, src.createView(), this.pipelines.splash,
        this._splashBindGroup(rt), impacts.length);
      this._drawInstanced(enc, src.createView(), this.pipelines.droplets,
        this._dropletBindGroup(rt), impacts.length * 12);
    }

    // final encode: disabled-surface composite, srgb -> output
    this.queue.writeBuffer(this.uniformBuffers.composite, 0, packCompositeConfig({ encode: 1 }));
    this._fullscreen(enc, args.outputTextureView, this.pipelines.compositeOutput,
      this._encodeBindGroup(src.createView()));

    this.queue.submit([enc.finish()]);
  }

  // ---- pass helpers ----
  _fullscreen(enc, view, pipeline, bindGroup) {
    const pass = enc.beginRenderPass({
      colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();
  }

  _drawInstanced(enc, view, pipeline, bindGroup, instances) {
    const pass = enc.beginRenderPass({
      colorAttachments: [{ view, loadOp: 'load', storeOp: 'store' }],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6, instances);
    pass.end();
  }

  // ---- texture lifecycle ----
  _ensureSurfaceTextures(rt) {
    const res = rt.res;
    const stateDesc = {
      size: { width: res, height: res }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
    };
    rt.stateA = this.pool.acquire(`${rt.surface.id}:stateA`, stateDesc);
    rt.stateB = this.pool.acquire(`${rt.surface.id}:stateB`, stateDesc);
    rt.deposit = this.pool.acquire(`${rt.surface.id}:deposit`, {
      size: { width: res, height: res }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
    rt.flow = this.pool.acquire(`${rt.surface.id}:flow`, {
      size: { width: res, height: res }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
    rt.reliefRaw = this.pool.acquire(`${rt.surface.id}:reliefRaw`, {
      size: { width: res, height: res }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    rt.relief = this.pool.acquire(`${rt.surface.id}:relief`, {
      size: { width: res, height: res }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
    rt.mask = this.pool.acquire(`${rt.surface.id}:mask`, {
      size: { width: res, height: res }, format: 'r8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    if (!rt.staticUploaded) {
      this._uploadStatic(rt);
      rt.staticUploaded = true;
    }
    rt.surfaceUniform ??= this.device.createBuffer({ size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    rt.flowUniform ??= this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this._writeSurfaceUniform(rt);
  }

  _writeSurfaceUniform(rt) {
    const np = normalProjection(rt.surface);
    this.queue.writeBuffer(rt.surfaceUniform, 0, packSurface({
      forward: rt.transforms.forward, inverse: rt.transforms.inverse,
      normalDir: np, enabled: rt.surface.enabled !== false, simResolution: rt.res,
    }));
    this.queue.writeBuffer(rt.flowUniform, 0, packFlowConfig(rt.flowConfig));
  }

  _uploadStatic(rt) {
    const res = rt.res;
    // mask (r8): bytesPerRow must be multiple of 256
    const padded = Math.ceil(res / 256) * 256;
    const maskBuf = new Uint8Array(padded * res);
    for (let y = 0; y < res; y++) maskBuf.set(rt.maskData.subarray(y * res, y * res + res), y * padded);
    this.queue.writeTexture({ texture: rt.mask }, maskBuf, { bytesPerRow: padded, rowsPerImage: res }, { width: res, height: res });

    // relief height (rgba16float) — upload as float32 then rely on conversion? WebGPU
    // writeTexture to rgba16float requires half-float data. We upload via a float32
    // staging compute is overkill; instead store relief as f32 in a temp and run the
    // relief_gradient pass which reads it. Simplest: pack to Float16.
    const half = floatToHalfArray(rt.reliefData.data);
    const bpr = Math.ceil((res * 4 * 2) / 256) * 256;
    const reliefBuf = new Uint8Array(bpr * res);
    const view = new DataView(reliefBuf.buffer);
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res * 4; x++) {
        view.setUint16(y * bpr + x * 2, half[(y * res * 4) + x], true);
      }
    }
    this.queue.writeTexture({ texture: rt.reliefRaw }, reliefBuf, { bytesPerRow: bpr, rowsPerImage: res }, { width: res, height: res });

    // derive relief gradient (reliefRaw -> relief) + build flow once
    const enc = this.device.createCommandEncoder();
    {
      const pass = enc.beginComputePass();
      pass.setPipeline(this.pipelines.reliefGradient);
      pass.setBindGroup(0, this.device.createBindGroup({
        layout: this.pipelines.reliefGradient.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: rt.reliefRaw.createView() },
          { binding: 1, resource: this.samplers.linear },
          { binding: 2, resource: rt.relief.createView() },
        ],
      }));
      pass.dispatchWorkgroups(Math.ceil(res / 8), Math.ceil(res / 8));
      pass.end();
    }
    this.device.queue.submit([enc.finish()]);
    this._buildFlow(rt);
  }

  _buildFlow(rt) {
    const res = rt.res;
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(this.pipelines.flowBuild);
    pass.setBindGroup(0, this.device.createBindGroup({
      layout: this.pipelines.flowBuild.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.params } },
        { binding: 1, resource: { buffer: rt.flowUniform } },
        { binding: 2, resource: rt.relief.createView() },
        { binding: 3, resource: rt.mask.createView() },
        { binding: 4, resource: this.samplers.linear },
        { binding: 5, resource: rt.flow.createView() },
      ],
    }));
    pass.dispatchWorkgroups(Math.ceil(res / 8), Math.ceil(res / 8));
    pass.end();
    this.device.queue.submit([enc.finish()]);
  }

  _clearState(rt) {
    // zero stateA via writeTexture
    const res = rt.res;
    const bpr = Math.ceil((res * 4 * 2) / 256) * 256;
    const zero = new Uint8Array(bpr * res);
    this.queue.writeTexture({ texture: rt.stateA }, zero, { bytesPerRow: bpr, rowsPerImage: res }, { width: res, height: res });
  }

  _restoreCheckpoint(rt, texture) {
    const enc = this.device.createCommandEncoder();
    enc.copyTextureToTexture({ texture }, { texture: rt.stateA }, { width: rt.res, height: rt.res });
    this.queue.submit([enc.finish()]);
  }

  _storeCheckpoint(step) {
    for (const rt of this.surfaceRuntime.values()) {
      const cp = this.pool.createDetached({
        size: { width: rt.res, height: rt.res }, format: 'rgba16float',
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
      });
      const enc = this.device.createCommandEncoder();
      enc.copyTextureToTexture({ texture: rt.stateA }, { texture: cp }, { width: rt.res, height: rt.res });
      this.queue.submit([enc.finish()]);
      this.checkpoints.store(step, cp); // note: single-surface checkpoint for demo
    }
  }

  _uploadImpacts(rt, impacts) {
    const data = packImpacts(impacts);
    const size = Math.max(64, data.byteLength);
    if (!rt.impactBuffer || rt.impactCapacity < size) {
      rt.impactBuffer?.destroy();
      rt.impactCapacity = Math.ceil(size / 64) * 64 * 2;
      rt.impactBuffer = this.device.createBuffer({
        size: rt.impactCapacity, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    this.queue.writeBuffer(rt.impactBuffer, 0, data);
    rt.impactCount = impacts.length;
  }

  // ---- bind groups ----
  _linearizeBindGroup(inputView) {
    return this.device.createBindGroup({
      layout: this.pipelines.linearize.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: inputView },
        { binding: 1, resource: this.samplers.linear },
      ],
    });
  }

  _depositBindGroup(rt) {
    return this.device.createBindGroup({
      layout: this.pipelines.deposit.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: { buffer: rt.impactBuffer } },
        { binding: 3, resource: rt.deposit.createView() },
      ],
    });
  }

  _wetUpdateBindGroup(rt) {
    return this.device.createBindGroup({
      layout: this.pipelines.wetUpdate.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: rt.stateA.createView() },
        { binding: 3, resource: rt.deposit.createView() },
        { binding: 4, resource: rt.flow.createView() },
        { binding: 5, resource: rt.relief.createView() },
        { binding: 6, resource: rt.mask.createView() },
        { binding: 7, resource: this.samplers.linear },
        { binding: 8, resource: rt.stateB.createView() },
      ],
    });
  }

  _compositeBindGroup(rt, colorInView) {
    return this.device.createBindGroup({
      layout: this.pipelines.compositeLinear.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: { buffer: rt.surfaceUniform } },
        { binding: 3, resource: colorInView },
        { binding: 4, resource: rt.stateA.createView() },
        { binding: 5, resource: rt.relief.createView() },
        { binding: 6, resource: rt.flow.createView() },
        { binding: 7, resource: rt.mask.createView() },
        { binding: 8, resource: (this.assets.microNormal ?? rt.relief).createView() },
        { binding: 9, resource: this.samplers.repeat },
        { binding: 10, resource: { buffer: this.uniformBuffers.composite } },
      ],
    });
  }

  _encodeBindGroup(colorInView) {
    // disabled surface uniform reused: build a tiny disabled surface buffer once
    this._disabledSurface ??= (() => {
      const b = this.device.createBuffer({ size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const ident = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      this.queue.writeBuffer(b, 0, packSurface({ forward: ident, inverse: ident, normalDir: { dx: 0, dy: 0 }, enabled: false, simResolution: 256 }));
      return b;
    })();
    const dummy = this._dummyTex ??= this.pool.acquire('dummy', {
      size: { width: 1, height: 1 }, format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const dummyMask = this._dummyMask ??= this.pool.acquire('dummyMask', {
      size: { width: 1, height: 1 }, format: 'r8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    return this.device.createBindGroup({
      layout: this.pipelines.compositeOutput.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: { buffer: this._disabledSurface } },
        { binding: 3, resource: colorInView },
        { binding: 4, resource: dummy.createView() },
        { binding: 5, resource: dummy.createView() },
        { binding: 6, resource: dummy.createView() },
        { binding: 7, resource: dummyMask.createView() },
        { binding: 8, resource: dummy.createView() },
        { binding: 9, resource: this.samplers.linear },
        { binding: 10, resource: { buffer: this.uniformBuffers.composite } },
      ],
    });
  }

  _splashBindGroup(rt) {
    return this.device.createBindGroup({
      layout: this.pipelines.splash.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: { buffer: rt.surfaceUniform } },
        { binding: 3, resource: { buffer: rt.impactBuffer } },
      ],
    });
  }

  _dropletBindGroup(rt) {
    return this.device.createBindGroup({
      layout: this.pipelines.droplets.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffers.frame } },
        { binding: 1, resource: { buffer: this.uniformBuffers.params } },
        { binding: 2, resource: { buffer: rt.surfaceUniform } },
        { binding: 3, resource: { buffer: rt.impactBuffer } },
      ],
    });
  }
}

// --- float32 -> float16 conversion for texture upload ---
function floatToHalfArray(f32) {
  const out = new Uint16Array(f32.length);
  for (let i = 0; i < f32.length; i++) out[i] = floatToHalf(f32[i]);
  return out;
}

function floatToHalf(val) {
  const f = new Float32Array(1);
  const i = new Int32Array(f.buffer);
  f[0] = val;
  const x = i[0];
  const sign = (x >> 16) & 0x8000;
  let exp = ((x >> 23) & 0xff) - 127 + 15;
  let mant = x & 0x7fffff;
  if (exp <= 0) return sign;
  if (exp >= 31) return sign | 0x7c00;
  return sign | (exp << 10) | (mant >> 13);
}
