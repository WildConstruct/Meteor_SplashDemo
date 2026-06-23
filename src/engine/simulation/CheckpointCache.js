// Immutable GPU-state checkpoints for deterministic seeking (build plan §21.2).
// Stores a cloned state texture every `interval` simulation steps. Backward or
// random seeks restore the nearest earlier checkpoint and replay forward.
//
// Host-neutral: GPUTexture is allowed in the engine; only browser acquisition
// of it is forbidden. The owner (MeteorEngine) supplies a clone callback.

export class CheckpointCache {
  /**
   * @param {object} opts
   * @param {number} opts.interval simulation steps between checkpoints
   * @param {number} [opts.maxCheckpoints]
   * @param {(tex:GPUTexture)=>void} [opts.onEvict] release callback
   */
  constructor({ interval = 30, maxCheckpoints = 64, onEvict } = {}) {
    this.interval = interval;
    this.maxCheckpoints = maxCheckpoints;
    this.onEvict = onEvict;
    /** @type {Map<number, GPUTexture>} simStep -> immutable texture */
    this.checkpoints = new Map();
    this.cacheKey = null;
  }

  /** Drop everything when the cache key changes (topology/history/seed change). */
  reset(cacheKey = null) {
    for (const tex of this.checkpoints.values()) this.onEvict?.(tex);
    this.checkpoints.clear();
    this.cacheKey = cacheKey;
  }

  shouldCheckpoint(simStep) {
    return simStep % this.interval === 0 && !this.checkpoints.has(simStep);
  }

  store(simStep, immutableTexture) {
    this.checkpoints.set(simStep, immutableTexture);
    this._evictIfNeeded();
  }

  /** Nearest checkpoint at or before targetStep, or null (=> replay from 0). */
  nearestAtOrBefore(targetStep) {
    let best = -1;
    for (const step of this.checkpoints.keys()) {
      if (step <= targetStep && step > best) best = step;
    }
    if (best < 0) return null;
    return { step: best, texture: this.checkpoints.get(best) };
  }

  _evictIfNeeded() {
    while (this.checkpoints.size > this.maxCheckpoints) {
      // Evict the sparsest middle checkpoint (keep frame 0 + most recent).
      const steps = [...this.checkpoints.keys()].sort((a, b) => a - b);
      const victim = steps[Math.floor(steps.length / 2)];
      const tex = this.checkpoints.get(victim);
      this.checkpoints.delete(victim);
      this.onEvict?.(tex);
    }
  }
}
