// droplets.wgsl — instanced analytic ballistic droplets (build plan §15.2, §20
// pass G). One instance per (impact, droplet-slot). Position is evaluated
// directly from event time — no CPU particle integration:
//   uv(age)    = uv0 + lateralVelocity * age
//   height(age)= verticalVelocity * age - 0.5 * g * age^2
// Height is projected along the art-directed surface normal.

const MAX_DROPLETS: u32 = 12u;
const GRAVITY: f32 = 9.8;

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<uniform> surface: Surface;
@group(0) @binding(3) var<storage, read> impacts: array<Impact>;
@group(0) @binding(4) var envTex: texture_2d<f32>; // sky the droplets reflect
@group(0) @binding(5) var samp: sampler;

struct DropVSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) alpha: f32,
};

const QUAD = array<vec2<f32>, 6>(
  vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
  vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
);

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> DropVSOut {
  var out: DropVSOut;
  let impIndex = iid / MAX_DROPLETS;
  let slot = iid % MAX_DROPLETS;
  let imp = impacts[impIndex];

  let seed = u32(imp.responseSeed);
  let a0 = rand01(seed, slot, 11u);
  let a1 = rand01(seed, slot, 12u);
  let a2 = rand01(seed, slot, 13u);

  let ageFrames = frame.frameIndex - imp.birthFrame;
  let lifeFrames = max(1.0, imp.lifetimeOv);
  // droplet lives a fraction of the impact lifetime
  let age = ageFrames / 30.0; // seconds at sim hz reference
  let alive = ageFrames >= 0.0 && ageFrames <= lifeFrames;

  // short-lived ejecta beads thrown out by the splash. Emit a moderate handful
  // per impact (scaled by spread); each flies on its own random ballistic arc.
  let emit = a2 < clamp(0.35 + imp.spreadOv * 0.30, 0.0, 0.85);

  if (!alive || !emit || surface.enabled < 0.5) {
    out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0);
    out.local = vec2<f32>(0.0);
    out.alpha = 0.0;
    return out;
  }

  let dir = a0 * 6.2831853;
  let speed = (0.4 + a1) * params.spread * imp.spreadOv * 0.06;
  let lateral = vec2<f32>(cos(dir), sin(dir)) * speed;
  let vVel = (0.6 + a1 * 0.8) * params.splashHeight * imp.heightOv;
  let h = max(0.0, vVel * age - 0.5 * GRAVITY * age * age * 0.4);

  let imgUV0 = apply_h(surface.homographyFwd, imp.surfaceUV);
  let center = imgUV0 + lateral * age + surface.normalDir * h;

  // Scale is artist-controllable via params.dropletScale (the "Droplet scale"
  // slider) so the spray can be dialed from a fine mist to fat beads.
  let radius = 0.0026 * params.dropletScale * imp.dropSize * (0.6 + 0.4 * a1);
  let q = QUAD[vid];
  let aspect = frame.resolution.x / max(frame.resolution.y, 1.0);
  let p = center + vec2<f32>(q.x, q.y * aspect) * radius;

  out.pos = vec4<f32>(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  out.local = q;
  out.alpha = (1.0 - ageFrames / lifeFrames) * imp.visualGain * params.visualGain * 0.8;
  return out;
}

@fragment
fn fs(in: DropVSOut) -> @location(0) vec4<f32> {
  let r = length(in.local);
  if (r > 1.0) {
    discard;
  }
  // Sphere-imposter shading (the lightweight take on screen-space fluid droplets):
  // treat the quad as a little water bead. Reconstruct a hemisphere normal, give
  // it a Fresnel rim that reflects the sky env, a bright specular glint, and a
  // soft body — so droplets read as rounded lit water beads, not flat sprites.
  let nz = sqrt(max(0.0, 1.0 - r * r));
  let n = vec3<f32>(in.local.x, in.local.y, nz);

  // reflect the sky env across the bead (rim grabs more sky -> Fresnel)
  let fres = pow(1.0 - nz, 3.0);
  let envUV = clamp(vec2<f32>(0.5 + n.x * 0.45, 0.18 - n.y * 0.35), vec2<f32>(0.0), vec2<f32>(1.0));
  let sky = textureSampleLevel(envTex, samp, envUV, 0.0).rgb;

  // specular glint toward the art-directed light
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.8));
  let spec = pow(max(dot(n, lightDir), 0.0), 24.0);

  let body = sky * (0.5 + 0.8 * fres) + vec3<f32>(1.0) * spec * 0.9;
  // fuller/brighter toward the bead centre; fade over the droplet's life
  let cover = (0.45 + 0.55 * nz) * in.alpha;
  return vec4<f32>(body * cover, cover); // additive (premultiplied) over the wet color
}
