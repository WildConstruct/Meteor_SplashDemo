// deposit_stamp.wgsl — compute pass that writes per-texel impact deposits into
// depositTex (build plan §17, §28 fallback: compute deposit instead of float
// additive blending). Each invocation owns one texel and sums contributions from
// all active impacts, avoiding atomics/blend entirely.
//
// depositTex channels: R wetnessDeposit, G waterDeposit, B rippleImpulse, A unused.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<storage, read> impacts: array<Impact>;
@group(0) @binding(3) var depositTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dim = textureDimensions(depositTex);
  if (gid.x >= dim.x || gid.y >= dim.y) {
    return;
  }
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));

  var wet = 0.0;
  var water = 0.0;
  var ripple = 0.0;

  let count = arrayLength(&impacts);
  for (var i = 0u; i < count; i = i + 1u) {
    let imp = impacts[i];
    let age = frame.frameIndex - imp.birthFrame;
    let lifeFrames = max(1.0, imp.lifetimeOv); // lifetimeOv is baked in frames
    if (age < 0.0 || age > lifeFrames) {
      continue;
    }
    // temporal kernel: sharp at birth, decaying over a few frames
    let tw = exp(-age * 0.6);
    let radius = 0.0025 + 0.004 * imp.dropSize * max(0.2, params.splashWidth) * max(0.2, imp.widthOv);
    let d = distance(uv, imp.surfaceUV);
    let spatial = exp(-(d * d) / (radius * radius));
    wet = wet + imp.wetnessDeposit * spatial * tw;
    water = water + imp.waterDeposit * spatial * tw;
    // Ripple impulse footprint kept small (a couple of texels at 512 sim res) so
    // each drop launches a tight ring — small and dense like real rain on water.
    let rippleRadius = 0.004 + 0.003 * imp.dropSize;
    let rippleSpatial = exp(-(d * d) / (rippleRadius * rippleRadius));
    ripple = ripple + imp.rippleImpulse * rippleSpatial * exp(-age * 1.5);
  }

  textureStore(depositTex, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(wet, water, ripple, 0.0));
}
