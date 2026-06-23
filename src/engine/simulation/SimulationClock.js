// Fixed-step simulation clock (build plan §17.1, §21.2). Converts timeline frames
// (at the project frame rate) into integer wet-state simulation steps at SIM_HZ.

import { SIM_HZ } from '../EngineContracts.js';

export class SimulationClock {
  /** @param {number} frameRate timeline frames per second */
  constructor(frameRate, simHz = SIM_HZ) {
    this.frameRate = frameRate;
    this.simHz = simHz;
    this.dt = 1 / simHz;
  }

  /** Integer simulation step index for a timeline frame (floored, deterministic). */
  simStepForFrame(frameIndex) {
    const t = frameIndex / this.frameRate;
    return Math.floor(t * this.simHz + 1e-6);
  }

  /** Seconds-per-step. */
  stepDt() {
    return this.dt;
  }
}
