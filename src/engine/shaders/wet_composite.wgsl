// wet_composite.wgsl — base wet composite + wet-look treatment (build plan §18).
// Runs once per surface, reading the previous linear color and compositing this
// surface's wet contribution. A final invocation with a disabled surface and
// compositeConfig.encode=1 performs the linear->sRGB encode to the output target.
//
// Two ways in:
//  - fs       fullscreen pass: screen->surface via the perspective homography
//             (flat planes). Also handles debug views + the final sRGB encode.
//  - fs_warp  mesh pass: a tessellated, BENT plane feeds surface UV per vertex
//             (curved surfaces), so no homography/inverse is needed. Linear
//             intermediate only; the shared wetCompositeLinear() does the look.
//
// Debug visualizations (build plan §4 step 14) are produced here when
// params.debugMode > 0.

struct CompositeConfig {
  encode: f32,        // 1 => linear_to_srgb on output
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<uniform> surface: Surface;
@group(0) @binding(3) var colorIn: texture_2d<f32>;
@group(0) @binding(4) var stateTex: texture_2d<f32>;
@group(0) @binding(5) var reliefTex: texture_2d<f32>;
@group(0) @binding(6) var flowTex: texture_2d<f32>;
@group(0) @binding(7) var maskTex: texture_2d<f32>;
@group(0) @binding(8) var microTex: texture_2d<f32>;
@group(0) @binding(9) var samp: sampler;
@group(0) @binding(10) var<uniform> cfg: CompositeConfig;
@group(0) @binding(11) var envTex: texture_2d<f32>; // environment/sky the puddle reflects

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  return fullscreen_vertex(vid);
}

fn encodeOut(rgb: vec3<f32>) -> vec3<f32> {
  if (cfg.encode > 0.5) {
    return linear_to_srgb(rgb);
  }
  return rgb;
}

// Fresnel-like weight: tilted ripple flanks (small n.z) reflect more strongly.
fn fresnelTilt(n: vec3<f32>) -> f32 {
  return pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);
}

// Shared wet look. Given a surface-UV sample point, the screen UV under it, and
// the background colour there, return the LINEAR composited colour (not encoded).
// Returns `base` unchanged where the mask is empty.
fn wetCompositeLinear(surfUV: vec2<f32>, imgUV: vec2<f32>, base: vec3<f32>) -> vec3<f32> {
  let mask = textureSampleLevel(maskTex, samp, surfUV, 0.0).r;
  if (mask < 0.01) {
    return base;
  }

  let state = textureSampleLevel(stateTex, samp, surfUV, 0.0);     // wet, water, rippleH, rippleV
  let relief = textureSampleLevel(reliefTex, samp, surfUV, 0.0);   // height, gx, gy, mag
  let flow = textureSampleLevel(flowTex, samp, surfUV, 0.0).xy;

  let wet = state.r;
  let water = state.g;
  let rippleH = state.b;

  // It is raining, so the masked ground reads wet — but how MUCH standing water
  // sits there at rest is the "Water Level" control, art-directed into PUDDLES by
  // a fractal-noise field: low spots pool, high spots stay merely damp. Puddle
  // Amount fades between uniform wetness and noise-carved puddles; Scale sets the
  // blob frequency; Edge sharpens the puddle boundary. Accumulated `wet` from
  // drops always pushes toward saturated on top.
  let gate = puddleGate(surfUV, params.puddleAmount, params.puddleScale, params.puddleEdge);
  let wetFloor = mask * params.waterLevel * gate;
  let wetAmt = clamp(max(wet, wetFloor), 0.0, 1.0);
  let pool = clamp(water, 0.0, 1.0);

  // ---- surface normal from the heightfield ripple gradient (+ micro breakup) ----
  let texel = 1.0 / max(surface.simResolution, 16.0);
  let rl = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).b;
  let rr = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).b;
  let rd = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(0.0, texel), 0.0).b;
  let ru = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(0.0, texel), 0.0).b;
  let ripGrad = vec2<f32>(rr - rl, ru - rd);
  let ripSlope = length(ripGrad);
  var n = vec3<f32>(-ripGrad * params.rippleNormalStrength * 4.0, 1.0);
  let micro = textureSampleLevel(microTex, samp, surfUV * 6.0, 0.0).xy * 2.0 - 1.0;
  n = normalize(n + vec3<f32>(micro * params.microNormalStrength * 0.3 * wetAmt, 0.0));

  // ---- Real water surface: Fresnel blend of REFRACTION (the bottom seen
  // through the film) and REFLECTION (what's above the surface), plus a sharp
  // specular glint. Same model as ThinMatrix / chinedufn water; with a single
  // locked plate we sample the plate as both the refracted bottom AND (offset
  // toward the horizon) the reflection. Because the ground is drawn in
  // perspective, the view is GRAZING toward the far edge (surfUV.y -> 0), so
  // Fresnel makes the puddle mirror-like in the distance and transparent up
  // close — which is exactly why reference puddle photos look so reflective. ----
  let distMag = 0.015 + 0.05 * params.distortion;

  // REFRACTION: darkened, ripple-distorted view of the ground beneath the film,
  // plus CAUSTICS — ripple crests act as lenses that focus light onto the bottom
  // (the bright wavy light webgpu-water shows). Concave surface (negative
  // Laplacian of the ripple height) => focused/brighter.
  let refrUV = imgUV + n.xy * distMag;
  let bottom = textureSampleLevel(colorIn, samp, refrUV, 0.0).rgb;
  let lap = (rl + rr + rd + ru) - 4.0 * rippleH;
  let caustic = clamp(-lap * 5.0, 0.0, 1.5);
  let refrCol = bottom * (1.0 - params.wetDarkening * 0.7 * wetAmt)
              + vec3<f32>(1.0, 0.97, 0.88) * caustic * wetAmt * 0.45;

  // REFLECTION: mirror a SPHERICAL sky (equirectangular env / HDRI) — NOT the
  // plate. Build a world reflection direction from the heightfield normal and
  // the surface's WORLD normal (set by the gizmo); grazing toward the horizon
  // lowers the elevation and the ripple normal shimmers the azimuth.
  let grazing = clamp(1.0 - surfUV.y, 0.0, 1.0);
  let wn = surface.worldNormal;
  let refl = normalize(vec3<f32>(
    wn.x * 1.5 + n.x * 2.2,
    mix(max(wn.z, 0.05), 0.2, grazing),
    -wn.y * 1.5 + n.y * 2.2 + grazing * 0.5,
  ));
  let lon = atan2(refl.x, refl.z) / 6.2831853 + 0.5;
  let envUV = vec2<f32>(fract(lon), clamp(0.5 - 0.5 * refl.y, 0.0, 1.0));
  let envCol = textureSampleLevel(envTex, samp, envUV, 0.0).rgb;
  let reflCol = envCol + vec3<f32>(0.5, 0.58, 0.72) * ripSlope * 0.4;

  // Fresnel: rises toward the grazing far edge and on tilted ripple flanks.
  let fres = clamp(mix(0.06, 0.9, grazing * grazing) + fresnelTilt(n) * 0.8, 0.0, 1.0);

  let waterCol = mix(refrCol, reflCol, fres);
  var col = mix(base, waterCol, wetAmt);
  let lum = luminance(col);
  col = mix(vec3<f32>(lum), col, 1.0 + params.saturationShift * wetAmt);

  // ---- specular glint (Blinn-Phong). The VIEW direction is the plane's world
  // normal (set by the orientation wheel), not a fixed straight-down — so tilting
  // the wheel changes the angle the ripples are *seen* at and the glints rake
  // across the surface, making the drops feel placed in the scene. ----
  let viewDir = normalize(vec3<f32>(wn.x, wn.y, max(wn.z, 0.2)));
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.55));
  let halfV = normalize(lightDir + viewDir);
  let spec = pow(max(dot(n, halfV), 0.0), mix(18.0, 220.0, 1.0 - clamp(params.specularWidth, 0.0, 1.0)));
  col = col + spec * params.specularGain * (0.4 + 0.7 * wetAmt);

  // ---- splash CROWN + central jet: displaced, lit water (no sprite). The crown
  // brightness is scaled DOWN (0.4) so the Splash Height slider ramps gradually
  // across its range instead of blowing to white within the first fraction. ----
  let crown = smoothstep(0.02, 0.4, rippleH);
  col = col + vec3<f32>(0.85, 0.90, 1.0) * crown * (0.45 + 0.9 * fres) * wetAmt * params.splashHeight * 0.4;

  // ---- reflective pooling: standing water is more mirror-like + glints harder.
  col = mix(col, reflCol, pool * 0.4 * params.poolHighlight);
  col = col + params.poolHighlight * 0.4 * pool * spec;

  // ---- flow streaks (subtle directional smear on the wet sheen) — low frequency
  // and gentle so they read as faint runoff, not a confusing repeating glint ----
  let streak = sin((surfUV.x * flow.y - surfUV.y * flow.x) * 28.0) * 0.5 + 0.5;
  col = col * (1.0 - params.flowStreakStrength * 0.05 * streak * wetAmt);

  // ---- edge bead near mask boundary ----
  let beadL = textureSampleLevel(maskTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).r;
  let beadR = textureSampleLevel(maskTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).r;
  let edge = abs(beadR - beadL);
  col = col + params.edgeBead * 0.3 * edge * wetAmt;

  col = col * params.visualGain;
  return col;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let imgUV = in.uv;
  var base = textureSampleLevel(colorIn, samp, imgUV, 0.0).rgb;

  if (surface.enabled < 0.5) {
    return vec4<f32>(encodeOut(base), 1.0);
  }

  let surfUV = apply_h(surface.homographyInv, imgUV);
  let inBounds = surfUV.x >= 0.0 && surfUV.x <= 1.0 && surfUV.y >= 0.0 && surfUV.y <= 1.0;
  if (!inBounds) {
    return vec4<f32>(encodeOut(base), 1.0);
  }

  // ---- debug views ----
  if (params.debugMode > 0.5) {
    let mask = textureSampleLevel(maskTex, samp, surfUV, 0.0).r;
    let state = textureSampleLevel(stateTex, samp, surfUV, 0.0);
    let relief = textureSampleLevel(reliefTex, samp, surfUV, 0.0);
    let flow = textureSampleLevel(flowTex, samp, surfUV, 0.0).xy;
    var dbg = base;
    let m = params.debugMode;
    if (m < 1.5) { dbg = vec3<f32>(surfUV, 0.0); }
    else if (m < 2.5) { dbg = vec3<f32>(fract(surfUV * 8.0), 0.5); }
    else if (m < 3.5) { dbg = vec3<f32>(state.r * 0.5); }
    else if (m < 4.5) { dbg = vec3<f32>(relief.r * 0.5 + 0.5); }
    else if (m < 5.5) { dbg = vec3<f32>(flow * 0.5 + 0.5, 0.5); }
    else if (m < 6.5) { dbg = vec3<f32>(0.0, state.g * 0.5, state.g); }
    else if (m < 7.5) { dbg = vec3<f32>(state.b * 0.5 + 0.5); }
    else { dbg = vec3<f32>(mask); }
    dbg = mix(base, dbg, step(0.01, mask));
    return vec4<f32>(encodeOut(dbg), 1.0);
  }

  return vec4<f32>(encodeOut(wetCompositeLinear(surfUV, imgUV, base)), 1.0);
}

// ---- warp mesh path: a bent plane feeds surface UV per vertex ----
struct WarpVSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) imgUV: vec2<f32>,   // screen UV (the bent image position)
  @location(1) surfUV: vec2<f32>,  // undeformed surface UV
};

@vertex
fn vs_warp(@location(0) posImg: vec2<f32>, @location(1) suv: vec2<f32>) -> WarpVSOut {
  var out: WarpVSOut;
  out.imgUV = posImg;
  out.surfUV = suv;
  // image UV (y-down, [0,1]) -> clip space
  out.pos = vec4<f32>(posImg.x * 2.0 - 1.0, 1.0 - posImg.y * 2.0, 0.0, 1.0);
  return out;
}

@fragment
fn fs_warp(in: WarpVSOut) -> @location(0) vec4<f32> {
  let base = textureSampleLevel(colorIn, samp, in.imgUV, 0.0).rgb;
  // linear intermediate (encode happens in the final fullscreen encode pass)
  return vec4<f32>(wetCompositeLinear(in.surfUV, in.imgUV, base), 1.0);
}
