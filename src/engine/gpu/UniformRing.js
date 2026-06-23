// UniformRing — sub-allocates aligned slices from one uniform buffer so multiple
// dispatches in a single command buffer can each read their own immutable uniform
// values (build plan §20.1). The browser demo advances wet-state with one submit
// per sim step (simpler ordering), but this utility is provided for batching and
// for the Dawn port, which may prefer a single command buffer per frame.

const UNIFORM_ALIGN = 256; // wgpu minUniformBufferOffsetAlignment

export class UniformRing {
  constructor(device, capacityBytes = 64 * 1024) {
    this.device = device;
    this.capacity = capacityBytes;
    this.buffer = device.createBuffer({
      label: 'uniform-ring',
      size: capacityBytes,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.cursor = 0;
  }

  reset() {
    this.cursor = 0;
  }

  /** Write `data` (Float32Array/ArrayBuffer) and return its dynamic offset. */
  push(data) {
    const bytes = data.byteLength;
    const padded = Math.ceil(bytes / UNIFORM_ALIGN) * UNIFORM_ALIGN;
    if (this.cursor + padded > this.capacity) this.cursor = 0; // wrap
    const offset = this.cursor;
    this.device.queue.writeBuffer(this.buffer, offset, data);
    this.cursor += padded;
    return offset;
  }

  dispose() {
    this.buffer.destroy();
  }
}
