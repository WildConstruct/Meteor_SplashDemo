// common.wgsl — shared structs + helpers prepended to every other Meteor shader
// (the engine and the WGSL validator both concatenate this fragment first).
//
// CRITICAL: hash_u32 / combine / rand01 MUST match src/engine/events/SeededHash.js
// so CPU event records and GPU evaluation agree bit-for-bit.

// ---- deterministic hash (mirror of SeededHash.js) ----
fn hash_u32(x_in: u32) -> u32 {
  var x = x_in;
  x = x ^ (x >> 16u);
  x = x * 0x7feb352du;
  x = x ^ (x >> 15u);
  x = x * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return x;
}

fn combine(acc: u32, value: u32) -> u32 {
  return hash_u32(acc ^ (value * 0x9e3779b1u));
}

fn rand01(a: u32, b: u32, c: u32) -> f32 {
  var h: u32 = 0x811c9dc5u;
  h = combine(h, a);
  h = combine(h, b);
  h = combine(h, c);
  return f32(h) / 4294967296.0;
}

// ---- color (build plan §19) ----
fn srgb_to_linear(c: vec3<f32>) -> vec3<f32> {
  let cutoff = step(vec3<f32>(0.04045), c);
  let low = c / 12.92;
  let high = pow((c + vec3<f32>(0.055)) / 1.055, vec3<f32>(2.4));
  return mix(low, high, cutoff);
}

fn linear_to_srgb(c: vec3<f32>) -> vec3<f32> {
  let cutoff = step(vec3<f32>(0.0031308), c);
  let low = c * 12.92;
  let high = 1.055 * pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055;
  return mix(low, high, cutoff);
}

fn luminance(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

// ---- value-noise FBM (hash after Dave Hoskins / Ethera super_fractal) ----
fn hash21(p: vec2<f32>) -> f32 {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);
  p3 = p3 + dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn vnoise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2<f32>(1.0, 0.0));
  let c = hash21(i + vec2<f32>(0.0, 1.0));
  let d = hash21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 4-octave FBM in ~[0,1]; art-directs where puddles pool.
fn fbm2(p_in: vec2<f32>) -> f32 {
  var p = p_in;
  var v = 0.0;
  var amp = 0.5;
  for (var i = 0; i < 4; i = i + 1) {
    v = v + amp * vnoise(p);
    p = p * 2.0;
    amp = amp * 0.5;
  }
  return v / 0.9375; // normalise sum of amplitudes (0.5+0.25+0.125+0.0625)
}

// Puddle membership in [0,1] at a surface-UV point: 1 = pooled, 0 = dry. `edge`
// sharpens the boundary. Shared by the composite (wet look) AND the deposit pass
// (so rings only emit where there's water to ring).
fn puddleField(uv: vec2<f32>, scale: f32, edge: f32) -> f32 {
  // domain warp the sample point so puddles read as organic pools with ragged
  // edges instead of smooth round blobs (the "breakup" the wet/dry look needs).
  let warp = vec2<f32>(
    fbm2(uv * scale * 0.5 + vec2<f32>(11.3, 5.1)),
    fbm2(uv * scale * 0.5 + vec2<f32>(41.7, 23.9)),
  ) - 0.5;
  let pud = fbm2(uv * scale + warp * 0.7);
  let e = clamp(edge, 0.0, 0.98);
  return smoothstep(0.5 - (1.0 - e) * 0.5, 0.5 + (1.0 - e) * 0.5, pud);
}

// Blend between "wet everywhere" (amount 0) and "wet only in puddles" (amount 1).
fn puddleGate(uv: vec2<f32>, amount: f32, scale: f32, edge: f32) -> f32 {
  return mix(1.0, puddleField(uv, scale, edge), clamp(amount, 0.0, 1.0));
}

// ---- shared uniform structs ----
// Packed scalar parameters. Field ORDER must match ParameterState.WGSL_PARAM_IDS
// (see docs/shader-bindings.md). 30 scalars.
struct Params {
  debugMode: f32,
  visualGain: f32,
  impactVelocity: f32,
  splashHeight: f32,
  splashWidth: f32,
  bounce: f32,
  spread: f32,
  lifetime: f32,
  flowSpeed: f32,
  evaporation: f32,
  reliefHeight: f32,
  reliefSoftness: f32,
  flowDeflection: f32,
  boundaryWrap: f32,
  wetDarkening: f32,
  saturationShift: f32,
  specularGain: f32,
  specularWidth: f32,
  specularDirection: f32,
  microNormalStrength: f32,
  flowStreakStrength: f32,
  rippleNormalStrength: f32,
  poolHighlight: f32,
  distortion: f32,
  edgeBead: f32,
  dropletScale: f32,
  waterLevel: f32,   // base standing-water/wetness floor inside the mask (0 dry .. 1 full pool)
  puddleAmount: f32, // how strongly fractal noise carves puddles into the wetness floor
  puddleScale: f32,  // puddle noise frequency (blobs across the surface)
  puddleEdge: f32,   // puddle boundary sharpness (0 soft .. 1 crisp)
};

struct Frame {
  resolution: vec2<f32>,
  pixelAspect: f32,
  timeSeconds: f32,
  frameIndex: f32,
  globalSeed: f32,
  simDt: f32,
  debugMode: f32,
};

struct Surface {
  homographyFwd: mat3x3<f32>, // surface UV -> image UV
  homographyInv: mat3x3<f32>, // image UV -> surface UV
  normalDir: vec2<f32>,       // screen-space displacement per unit splash height
  enabled: f32,
  simResolution: f32,
  worldNormal: vec3<f32>,     // 3D world normal of the plane (x right, y up, z toward camera)
  aspect: f32,                // quad world aspect (width/height) — keeps sim footprints round
};

// One active impact (deposit_stamp / splash / droplets). 16 f32 = 64 bytes.
// Byte offsets documented in docs/shader-bindings.md for Dawn parity.
struct Impact {
  surfaceUV: vec2<f32>,    // 0
  birthFrame: f32,         // 8
  dropSize: f32,           // 12
  responseIndex: f32,      // 16
  incomingVelocity: f32,   // 20
  responseSeed: f32,       // 24
  visualGain: f32,         // 28
  heightOv: f32,           // 32
  widthOv: f32,            // 36
  bounceOv: f32,           // 40
  spreadOv: f32,           // 44
  lifetimeOv: f32,         // 48
  rippleImpulse: f32,      // 52
  wetnessDeposit: f32,     // 56
  waterDeposit: f32,       // 60
};

// homography apply with perspective divide
fn apply_h(m: mat3x3<f32>, p: vec2<f32>) -> vec2<f32> {
  let r = m * vec3<f32>(p, 1.0);
  return r.xy / r.z;
}

// fullscreen-triangle vertex helper
struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

fn fullscreen_vertex(vid: u32) -> VSOut {
  var out: VSOut;
  // 3-vertex covering triangle
  let x = f32((vid << 1u) & 2u);
  let y = f32(vid & 2u);
  out.uv = vec2<f32>(x, y);
  out.pos = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  return out;
}
