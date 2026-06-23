// ripple_update.wgsl — separable ripple solver (damped wave). For the browser
// demo the ripple step is merged into wet_update.wgsl for one fewer ping-pong;
// this standalone form is kept valid + Metal-portable for the Dawn bridge, which
// may prefer separate passes. Reads state + deposit, writes B/A (ripple h/v) and
// passes wetness/water through unchanged.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var stateIn: texture_2d<f32>;
@group(0) @binding(3) var depositTex: texture_2d<f32>;
@group(0) @binding(4) var linSamp: sampler;
@group(0) @binding(5) var stateOut: texture_storage_2d<rgba16float, write>;

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

  let c = textureSampleLevel(stateIn, linSamp, uv, 0.0);
  let l = textureSampleLevel(stateIn, linSamp, uv - vec2<f32>(texel.x, 0.0), 0.0).b;
  let r = textureSampleLevel(stateIn, linSamp, uv + vec2<f32>(texel.x, 0.0), 0.0).b;
  let d = textureSampleLevel(stateIn, linSamp, uv - vec2<f32>(0.0, texel.y), 0.0).b;
  let u = textureSampleLevel(stateIn, linSamp, uv + vec2<f32>(0.0, texel.y), 0.0).b;
  let deposit = textureSampleLevel(depositTex, linSamp, uv, 0.0);

  let lap = (l + r + d + u) - 4.0 * c.b;
  var vel = c.a + (0.25 * lap - 2.5 * c.a) * dt + deposit.b;
  var hgt = clamp(c.b + vel * dt, -4.0, 4.0);

  textureStore(stateOut, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(c.r, c.g, hgt, vel));
}
