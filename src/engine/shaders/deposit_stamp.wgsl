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
@group(0) @binding(4) var<uniform> surface: Surface;
@group(0) @binding(5) var<storage, read> rivulets: array<Rivulet>;
@group(0) @binding(6) var<uniform> drip: DripConfig;

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
    // Aspect-correct the footprint: the square sim UV is stretched onto a (often
    // very wide) calibration quad, so a circle in UV is an ellipse in the world
    // plane. Scaling the u offset by the quad aspect makes drops land as ROUND
    // rings in the world (the perspective then foreshortens them naturally).
    let delta = (uv - imp.surfaceUV) * vec2<f32>(surface.aspect, 1.0);
    let d = length(delta);
    let spatial = exp(-(d * d) / (radius * radius));
    // Puddle gate at the IMPACT point: a drop only rings where there is standing
    // water. On a dry patch it still dampens the ground a touch but emits no ring.
    let gate = puddleGate(imp.surfaceUV, params.puddleAmount, params.puddleScale, params.puddleEdge);
    wet = wet + imp.wetnessDeposit * spatial * tw * (0.3 + 0.7 * gate);
    water = water + imp.waterDeposit * spatial * tw * gate;
    // Ripple impulse footprint kept TIGHT (~2.5x smaller than before) so each drop
    // launches a small ring — dense like real rain on a puddle, not giant rings.
    let rippleRadius = 0.0016 + 0.0012 * imp.dropSize;
    let rippleSpatial = exp(-(d * d) / (rippleRadius * rippleRadius));
    ripple = ripple + imp.rippleImpulse * rippleSpatial * exp(-age * 1.5) * gate;
  }

  // --- rivulet trails: gather wet/water from the streaming particles. As each
  // rivulet runs down, it deposits here every step; the wet channel's persistence
  // turns that into a continuous trail behind the bright head. ---
  if (drip.amount > 0.001) {
    let rc = arrayLength(&rivulets);
    let rw = max(drip.width, 0.002);
    for (var ri = 0u; ri < rc; ri = ri + 1u) {
      let rv = rivulets[ri];
      if (rv.water <= 0.0) { continue; }
      let dd = (uv - rv.pos) * vec2<f32>(surface.aspect, 1.0);
      let sp = exp(-dot(dd, dd) / (rw * rw));
      wet = wet + sp * drip.amount * 0.6 * rv.water;
      water = water + sp * drip.amount * 0.35 * rv.water;
    }
  }

  textureStore(depositTex, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(wet, water, ripple, 0.0));
}
