// wet_update.wgsl — fixed-step wet-state solver (build plan §17.1). One compute
// dispatch advances the full state texture (ping-pong). This is a visual solver,
// NOT conservation-grade fluid.
//
// state channels (rgba16float): R wetness, G shallow-water, B ripple height,
// A ripple velocity.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var stateIn: texture_2d<f32>;
@group(0) @binding(3) var depositTex: texture_2d<f32>;
@group(0) @binding(4) var flowTex: texture_2d<f32>;
@group(0) @binding(5) var reliefTex: texture_2d<f32>;
@group(0) @binding(6) var maskTex: texture_2d<f32>;
@group(0) @binding(7) var linSamp: sampler;
@group(0) @binding(8) var stateOut: texture_storage_2d<rgba16float, write>;

fn sampleState(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(stateIn, linSamp, uv, 0.0);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dim = textureDimensions(stateOut);
  if (gid.x >= dim.x || gid.y >= dim.y) {
    return;
  }
  let res = vec2<f32>(f32(dim.x), f32(dim.y));
  let texel = 1.0 / res;
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) * texel;
  let dt = max(frame.simDt, 1.0 / 120.0);

  let mask = textureSampleLevel(maskTex, linSamp, uv, 0.0).r;
  let deposit = textureSampleLevel(depositTex, linSamp, uv, 0.0);
  let flow = textureSampleLevel(flowTex, linSamp, uv, 0.0).xy;

  // --- advect wetness/water by backtracing along the flow field ---
  let advectStep = flow * params.flowSpeed * dt;
  let srcUV = clamp(uv - advectStep, vec2<f32>(0.0), vec2<f32>(1.0));
  let advected = sampleState(srcUV);

  var wet = advected.r;
  var water = advected.g;

  // --- diffusion (4-tap) ---
  let l = sampleState(uv - vec2<f32>(texel.x, 0.0));
  let r = sampleState(uv + vec2<f32>(texel.x, 0.0));
  let d = sampleState(uv - vec2<f32>(0.0, texel.y));
  let u = sampleState(uv + vec2<f32>(0.0, texel.y));
  let avg = (l + r + d + u) * 0.25;
  let diffuse = 0.12;
  wet = mix(wet, avg.r, diffuse);
  water = mix(water, avg.g, diffuse * 1.5);

  // --- deposits ---
  wet = wet + deposit.r;
  water = water + deposit.g;

  // --- absorption / evaporation / runoff ---
  let evap = clamp(params.evaporation * dt, 0.0, 1.0);
  wet = max(0.0, wet - evap * 0.25);
  water = max(0.0, water - evap * 0.6);
  // shallow water slowly soaks into wetness
  let soak = min(water, 0.5 * dt);
  water = water - soak;
  wet = wet + soak * 0.5;

  wet = clamp(wet, 0.0, 4.0);
  water = clamp(water, 0.0, 4.0);

  // --- ripple: Evan Wallace heightfield wave solver (madebyevan.com/webgl-water,
  //     ported in jeantimex/webgpu-water — MIT). On a fixed-step grid the
  //     velocity relaxes toward the neighbour-average height, is lightly damped,
  //     then the height integrates the velocity. This is the proven model that
  //     produces clean, long-lived CONCENTRIC RINGS from a point impulse — the
  //     signature raindrop-on-puddle look. Driven by our art-directed impacts
  //     via deposit.b (rippleImpulse). Evaluated on the fixed grid (not flow-
  //     advected) so the rings stay crisp.
  let center = sampleState(uv);
  let neighborAvg = (l.b + r.b + d.b + u.b) * 0.25;
  var vel = center.a + (neighborAvg - center.b) * 2.0;
  // Heavier damping: with continuous rain the heightfield ACCUMULATES, so light
  // damping let ripple energy pile up until the height clamped everywhere and the
  // wave froze ('stopped reacting'). Stronger damping holds a low, bounded
  // steady state — rings stay lively AND fade sooner, so they read smaller/denser.
  vel = vel * 0.90;
  vel = vel - deposit.b;             // raindrop dimples the surface, then rebounds
  var hgt = (center.b + vel) * 0.997; // gentle height bleed prevents slow DC buildup
  hgt = clamp(hgt, -3.0, 3.0);

  // --- mask boundary ---
  let m = step(0.01, mask);
  let outv = vec4<f32>(wet * m, water * m, hgt * m, vel * m);
  textureStore(stateOut, vec2<i32>(i32(gid.x), i32(gid.y)), outv);
}
