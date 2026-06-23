// Deterministic checkpointed replay planner (build plan §21.2).
//
// Given the current simulation step and a target step, decides the sequence of
// fixed steps to run. Pure planning logic — the actual GPU dispatches happen in
// MeteorEngine. This keeps seeking deterministic and host-neutral.

/**
 * Plan how to reach `targetStep` from `currentStep`.
 * - forward & close: advance the difference;
 * - backward or large jump: restore nearest checkpoint, then replay forward.
 *
 * @param {object} args
 * @param {number} args.currentStep  current simulation step (-1 if uninitialised)
 * @param {number} args.targetStep
 * @param {import('./CheckpointCache.js').CheckpointCache} args.cache
 * @returns {{ restoreFrom: number|null, restoreTexture: GPUTexture|null, replaySteps: number, fromStep: number }}
 */
export function planSeek({ currentStep, targetStep, cache }) {
  if (targetStep < 0) targetStep = 0;

  // Pure forward advance from a valid current state.
  if (currentStep >= 0 && targetStep >= currentStep) {
    return {
      restoreFrom: null,
      restoreTexture: null,
      replaySteps: targetStep - currentStep,
      fromStep: currentStep,
    };
  }

  // Backward or uninitialised: restore the nearest earlier checkpoint.
  const cp = cache.nearestAtOrBefore(targetStep);
  if (cp) {
    return {
      restoreFrom: cp.step,
      restoreTexture: cp.texture,
      replaySteps: targetStep - cp.step,
      fromStep: cp.step,
    };
  }

  // No checkpoint: clear to zero and replay from the start.
  return { restoreFrom: 0, restoreTexture: null, replaySteps: targetStep, fromStep: 0 };
}
