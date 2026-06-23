// Regression guard for the WebGPU render path WITHOUT a real GPU.
//
// CI has no GPU, so bind-group wiring bugs (e.g. binding a buffer that has not
// been created yet) slipped past unit tests and only surfaced in a real browser
// as: "Failed to execute 'createBindGroup' ... Failed to read the 'buffer'
// property from 'GPUBufferBinding': Required member is undefined."
//
// This drives MeteorEngine.render() through a mock device whose createBindGroup
// reproduces WebGPU's validation: every { buffer } resource must be defined.
// render() swallows its own errors into diagnostics, so we assert that no error
// diagnostic is emitted (and that the bind-group path actually executed).

import { describe, it, expect, beforeAll } from 'vitest';
import { MeteorEngine } from '../../../src/engine/MeteorEngine.js';
import project from '../../../src/client/projects/hard-surface-topdown.meteor.json';

beforeAll(() => {
  // Bit flags the engine references at call time. Values are arbitrary; the mock
  // never inspects them.
  globalThis.GPUTextureUsage = {
    TEXTURE_BINDING: 1, STORAGE_BINDING: 2, COPY_SRC: 4, COPY_DST: 8,
    RENDER_ATTACHMENT: 16,
  };
  globalThis.GPUBufferUsage = {
    UNIFORM: 1, STORAGE: 2, COPY_SRC: 4, COPY_DST: 8,
  };
});

function makeMockDevice() {
  const bindGroupEntries = []; // every entry passed to createBindGroup
  const pass = {
    setPipeline() {}, setBindGroup() {}, setVertexBuffer() {},
    dispatchWorkgroups() {}, draw() {}, end() {},
  };
  const encoder = {
    beginComputePass: () => pass,
    beginRenderPass: () => pass,
    copyTextureToTexture() {},
    finish: () => ({}),
  };
  const device = {
    createShaderModule: () => ({}),
    createSampler: () => ({ __sampler: true }),
    createBuffer: (d) => ({ ...d, __buffer: true, destroy() {} }),
    createTexture: (d) => ({
      width: d.size.width, height: d.size.height, format: d.format,
      createView: () => ({ __view: true }), destroy() {},
    }),
    createComputePipeline: () => ({ getBindGroupLayout: () => ({}) }),
    createRenderPipeline: () => ({ getBindGroupLayout: () => ({}) }),
    createCommandEncoder: () => encoder,
    pushErrorScope() {},
    popErrorScope: async () => null,
    createBindGroup(desc) {
      for (const e of desc.entries) {
        bindGroupEntries.push(e);
        const r = e.resource;
        // Mirror WebGPU: a GPUBufferBinding's `buffer` must be defined.
        if (r && Object.prototype.hasOwnProperty.call(r, 'buffer') && r.buffer == null) {
          throw new Error(
            "Failed to execute 'createBindGroup' on 'GPUDevice': Failed to read the " +
            "'buffer' property from 'GPUBufferBinding': Required member is undefined.",
          );
        }
      }
      return { __bindGroup: true };
    },
  };
  const queue = {
    writeBuffer() {}, writeTexture() {}, copyExternalImageToTexture() {}, submit() {},
  };
  device.queue = queue; // engine uses both this.queue and this.device.queue
  return { device, queue, bindGroupEntries };
}

describe('MeteorEngine render path (mock GPU)', () => {
  it('builds every bind group with all buffer bindings defined', async () => {
    const { device, queue, bindGroupEntries } = makeMockDevice();
    const diagnostics = [];

    const engine = await MeteorEngine.create({
      device, queue, outputFormat: 'rgba8unorm', shaderSources: {},
      diagnostics: (d) => diagnostics.push(d),
    });
    engine.registerAssets({ microNormal: device.createTexture({ size: { width: 4, height: 4 }, format: 'rgba8unorm' }) });
    engine.resize({ width: 256, height: 256, pixelAspect: 1 });
    engine.setProject(project);

    engine.render({
      frameIndex: 0,
      timeSeconds: 0,
      inputTextureView: { __view: true },
      outputTextureView: { __view: true },
      debugMode: 0,
    });

    const errors = diagnostics.filter((d) => d.level === 'error');
    expect(errors, errors.map((e) => e.message).join('\n')).toHaveLength(0);

    // Sanity: the render path actually exercised bind-group creation with buffers.
    expect(bindGroupEntries.length).toBeGreaterThan(0);
    expect(bindGroupEntries.some((e) => e.resource && 'buffer' in e.resource)).toBe(true);
  });
});
