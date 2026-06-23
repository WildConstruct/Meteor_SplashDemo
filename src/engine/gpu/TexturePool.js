// TexturePool — centralized texture lifetime (build plan §20.1, §25). Textures are
// created on demand by a stable key and reused across frames; recreation is scoped
// to resolution/topology changes. Host-neutral (GPUTexture is allowed in engine).

export class TexturePool {
  constructor(device) {
    this.device = device;
    /** @type {Map<string, GPUTexture>} */
    this.textures = new Map();
  }

  /** Get-or-create a texture for `key`. Recreates if size/format changed. */
  acquire(key, descriptor) {
    const existing = this.textures.get(key);
    if (
      existing &&
      existing.width === descriptor.size.width &&
      existing.height === descriptor.size.height &&
      existing.format === descriptor.format
    ) {
      return existing;
    }
    if (existing) existing.destroy();
    const tex = this.device.createTexture({ label: key, ...descriptor });
    this.textures.set(key, tex);
    return tex;
  }

  get(key) {
    return this.textures.get(key);
  }

  /** Create a standalone (untracked) texture, e.g. an immutable checkpoint. */
  createDetached(descriptor) {
    return this.device.createTexture(descriptor);
  }

  destroyKey(key) {
    const t = this.textures.get(key);
    if (t) {
      t.destroy();
      this.textures.delete(key);
    }
  }

  destroyAll() {
    for (const t of this.textures.values()) t.destroy();
    this.textures.clear();
  }
}
