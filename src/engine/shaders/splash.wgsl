// splash.wgsl — instanced contact splashes (build plan §15, §20 pass F). One
// instance per active impact draws a screen-space quad with an analytic contact
// ring + lifted crown. Engine draws 6 vertices * impactCount with additive blend.
// Crowns lift along the artist-defined surface normal (surface.normalDir).

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<uniform> surface: Surface;
@group(0) @binding(3) var<storage, read> impacts: array<Impact>;

struct SplashVSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) local: vec2<f32>,   // [-1,1] quad coords
  @location(1) life: f32,          // age fraction 0..1
  @location(2) gain: f32,
};

const QUAD = array<vec2<f32>, 6>(
  vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
  vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
);

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> SplashVSOut {
  var out: SplashVSOut;
  let imp = impacts[iid];
  let ageFrames = frame.frameIndex - imp.birthFrame;
  let lifeFrames = max(1.0, imp.lifetimeOv);
  let t = ageFrames / lifeFrames;

  // off-screen collapse for inactive impacts
  if (ageFrames < 0.0 || t > 1.0 || surface.enabled < 0.5) {
    out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0);
    out.local = vec2<f32>(0.0);
    out.life = 0.0;
    out.gain = 0.0;
    return out;
  }

  let imgUV = apply_h(surface.homographyFwd, imp.surfaceUV);
  // crown lift along the art-directed normal, scaled by splashHeight
  let crownH = sin(clamp(t, 0.0, 1.0) * 3.14159) * imp.heightOv * params.splashHeight;
  let lift = surface.normalDir * crownH;
  let center = imgUV + lift;

  let radius = (0.01 + 0.03 * imp.dropSize) * imp.widthOv * params.splashWidth
             * (0.4 + 0.6 * t);
  let q = QUAD[vid];
  let aspect = frame.resolution.x / max(frame.resolution.y, 1.0);
  let p = center + vec2<f32>(q.x, q.y * aspect) * radius;

  out.pos = vec4<f32>(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  out.local = q;
  out.life = t;
  out.gain = imp.visualGain * params.visualGain;
  return out;
}

@fragment
fn fs(in: SplashVSOut) -> @location(0) vec4<f32> {
  let r = length(in.local);
  if (r > 1.0) {
    discard;
  }
  // contact ring: bright annulus that expands; fades over life
  let ring = smoothstep(0.9, 0.6, r) * smoothstep(0.2, 0.5, r);
  let core = smoothstep(0.5, 0.0, r);
  let fade = 1.0 - in.life;
  let intensity = (ring * 0.8 + core * 0.4) * fade * in.gain;
  let rgb = vec3<f32>(0.9, 0.95, 1.0) * intensity;
  return vec4<f32>(rgb, intensity); // premultiplied; engine uses additive blend
}
