// CPU->GPU struct packing (build plan §14, §20.1, §27). Layouts mirror the WGSL
// structs in shaders/common.wgsl and are documented in docs/shader-bindings.md.
// Pure + host-neutral.

/**
 * Pack a row-major 3x3 into the column-major, 16-byte-column-stride layout WebGPU
 * uses for mat3x3<f32> (12 floats, the 4th of each column is padding).
 * row-major input m[row*3+col]; column j holds (m[0,j], m[1,j], m[2,j]).
 */
export function packMat3(m, out, offset = 0) {
  for (let col = 0; col < 3; col++) {
    out[offset + col * 4 + 0] = m[0 * 3 + col];
    out[offset + col * 4 + 1] = m[1 * 3 + col];
    out[offset + col * 4 + 2] = m[2 * 3 + col];
    out[offset + col * 4 + 3] = 0;
  }
  return out;
}

/** Frame uniform: 8 f32 = 32 bytes (see common.wgsl `Frame`). */
export function packFrame({ width, height, pixelAspect, timeSeconds, frameIndex, globalSeed, simDt, debugMode }) {
  const a = new Float32Array(8);
  a[0] = width;
  a[1] = height;
  a[2] = pixelAspect ?? 1;
  a[3] = timeSeconds ?? 0;
  a[4] = frameIndex ?? 0;
  a[5] = globalSeed ?? 0;
  a[6] = simDt ?? 1 / 30;
  a[7] = debugMode ?? 0;
  return a;
}

/**
 * Surface uniform: 2x mat3 (48 each) + vec2 normalDir + enabled + simResolution.
 * Total 112 bytes (28 f32).
 */
export function packSurface({ forward, inverse, normalDir, enabled, simResolution }) {
  const a = new Float32Array(28);
  packMat3(forward, a, 0); // 0..11
  packMat3(inverse, a, 12); // 12..23
  a[24] = normalDir?.dx ?? 0;
  a[25] = normalDir?.dy ?? 0;
  a[26] = enabled ? 1 : 0;
  a[27] = simResolution ?? 256;
  return a;
}

/**
 * Impact storage element: 16 f32 = 64 bytes (see common.wgsl `Impact`).
 * lifetimeOv is baked in FRAMES. wetnessDeposit/waterDeposit/rippleImpulse are
 * the effective (response * global) values.
 */
export function packImpacts(impacts) {
  const a = new Float32Array(Math.max(1, impacts.length) * 16);
  impacts.forEach((imp, i) => {
    const o = i * 16;
    a[o + 0] = imp.surfaceUV.u ?? imp.surfaceUV.x ?? 0;
    a[o + 1] = imp.surfaceUV.v ?? imp.surfaceUV.y ?? 0;
    a[o + 2] = imp.birthFrame ?? 0;
    a[o + 3] = imp.dropSize ?? 1;
    a[o + 4] = imp.responseIndex ?? 0;
    a[o + 5] = imp.incomingVelocity ?? 1;
    a[o + 6] = imp.responseSeed >>> 0;
    a[o + 7] = imp.visualGain ?? 1;
    a[o + 8] = imp.heightOv ?? 1;
    a[o + 9] = imp.widthOv ?? 1;
    a[o + 10] = imp.bounceOv ?? 1;
    a[o + 11] = imp.spreadOv ?? 1;
    a[o + 12] = imp.lifetimeOv ?? 15;
    a[o + 13] = imp.rippleImpulse ?? 0.3;
    a[o + 14] = imp.wetnessDeposit ?? 0.5;
    a[o + 15] = imp.waterDeposit ?? 0.2;
  });
  return a;
}

export const IMPACT_STRIDE_BYTES = 64;

/** CompositeConfig: 4 f32 = 16 bytes. */
export function packCompositeConfig({ encode }) {
  const a = new Float32Array(4);
  a[0] = encode ? 1 : 0;
  return a;
}

/** FlowConfig: baseFlow vec2 + bias vec2 = 16 bytes. */
export function packFlowConfig({ baseFlow, bias }) {
  const a = new Float32Array(4);
  a[0] = baseFlow?.x ?? 0;
  a[1] = baseFlow?.y ?? 0;
  a[2] = bias?.x ?? 0;
  a[3] = bias?.y ?? 0;
  return a;
}
