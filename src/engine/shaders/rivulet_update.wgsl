// rivulet_update.wgsl — advance the per-surface water rivulets (drip / streaming
// on a windshield or any running surface). One thread per rivulet. Rivulets run
// DOWN the surface along the flow field + gravity, meander a little, lose volume,
// and respawn at the top when depleted or off-surface. They deposit a wet trail
// in deposit_stamp (gather), which the main composite then renders as streaming
// water — no separate "drip look", it mixes into the same wet state.
//
// Forces are deterministic functions of (index, frameIndex, seed) so a replayed
// sim reproduces the same streaming.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<storage, read_write> rivulets: array<Rivulet>;
@group(0) @binding(2) var flowTex: texture_2d<f32>;
@group(0) @binding(3) var<uniform> drip: DripConfig;
@group(0) @binding(4) var linSamp: sampler;

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= arrayLength(&rivulets)) { return; }
  if (drip.amount < 0.001) { return; } // streaming off for this surface

  var r = rivulets[i];
  let dt = max(frame.simDt, 1.0 / 120.0);

  // direction: the surface's runoff flow plus a downward gravity bias (+v = down)
  let flow = textureSampleLevel(flowTex, linSamp, clamp(r.pos, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0).xy;
  let dir = normalize(flow + vec2<f32>(0.0, 1.5) + vec2<f32>(1.0e-5, 0.0));
  // horizontal meander + per-rivulet speed variation
  let wob = sin(r.pos.y * 18.0 + r.seed + frame.timeSeconds * 1.5) * drip.meander;
  let speed = drip.speed * (0.5 + 0.8 * fract(r.seed * 0.013));
  r.vel = dir * speed + vec2<f32>(wob * 0.15, 0.0);
  r.pos = r.pos + r.vel * dt;
  r.water = r.water - dt * 0.15; // streaming bleeds volume as it runs

  // respawn at the top edge with a fresh column when depleted or off-surface
  if (r.water <= 0.0 || r.pos.y > 1.05 || r.pos.x < -0.05 || r.pos.x > 1.05) {
    let fi = u32(max(frame.frameIndex, 0.0));
    let h = rand01(i, fi, bitcast<u32>(r.seed));
    let h2 = rand01(i + 7u, fi + 13u, bitcast<u32>(r.seed));
    r.pos = vec2<f32>(h, -0.02);
    r.vel = vec2<f32>(0.0, 0.0);
    r.water = 0.6 + 0.4 * h2;
    r.seed = h2 * 1000.0;
  }

  rivulets[i] = r;
}
