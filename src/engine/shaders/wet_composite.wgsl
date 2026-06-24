// wet_composite.wgsl — base wet composite + wet-look treatment (build plan §18).
// Runs once per surface, reading the previous linear color and compositing this
// surface's wet contribution. A final invocation with a disabled surface and
// compositeConfig.encode=1 performs the linear->sRGB encode to the output target.
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

  let mask = textureSampleLevel(maskTex, samp, surfUV, 0.0).r;
  let state = textureSampleLevel(stateTex, samp, surfUV, 0.0);     // wet, water, rippleH, rippleV
  let relief = textureSampleLevel(reliefTex, samp, surfUV, 0.0);   // height, gx, gy, mag
  let flow = textureSampleLevel(flowTex, samp, surfUV, 0.0).xy;

  let wet = state.r;
  let water = state.g;
  let rippleH = state.b;

  // ---- debug views ----
  if (params.debugMode > 0.5) {
    var dbg = base;
    let m = params.debugMode;
    if (m < 1.5) { dbg = vec3<f32>(surfUV, 0.0); }              // surface UV
    else if (m < 2.5) { dbg = vec3<f32>(fract(surfUV * 8.0), 0.5); } // impact-ID grid
    else if (m < 3.5) { dbg = vec3<f32>(wet * 0.5); }           // wetness
    else if (m < 4.5) { dbg = vec3<f32>(relief.r * 0.5 + 0.5); }// relief
    else if (m < 5.5) { dbg = vec3<f32>(flow * 0.5 + 0.5, 0.5); } // flow
    else if (m < 6.5) { dbg = vec3<f32>(0.0, water * 0.5, water); } // pool
    else if (m < 7.5) { dbg = vec3<f32>(rippleH * 0.5 + 0.5); } // ripple
    else { dbg = vec3<f32>(mask); }                             // mask
    dbg = mix(base, dbg, step(0.01, mask));
    return vec4<f32>(encodeOut(dbg), 1.0);
  }

  if (mask < 0.01) {
    return vec4<f32>(encodeOut(base), 1.0);
  }

  // It is raining across the field, so the masked ground reads WET everywhere —
  // not just where individual drops landed. Take a base wetness inside the mask
  // and let accumulated wetness push it to fully saturated. This is the single
  // biggest difference from a "dry surface with dots": the whole surface is wet.
  let wetAmt = clamp(max(wet, mask * 0.92), 0.0, 1.0);
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

  // REFRACTION: darkened, ripple-distorted view of the ground beneath the film.
  let refrUV = imgUV + n.xy * distMag;
  let bottom = textureSampleLevel(colorIn, samp, refrUV, 0.0).rgb;
  let refrCol = bottom * (1.0 - params.wetDarkening * 0.7 * wetAmt);

  // REFLECTION: sample the plate offset toward the horizon (what's "above" the
  // puddle in the scene), ripple-distorted, tinted cool and lifted by bright
  // reflected-light streaks. This is the vertical reflection you see in puddles.
  let grazing = clamp(1.0 - surfUV.y, 0.0, 1.0);
  let upY = clamp(imgUV.y - (0.06 + 0.28 * grazing) - n.y * distMag * 2.0, 0.0, 1.0);
  let aboveCol = textureSampleLevel(colorIn, samp, vec2<f32>(imgUV.x + n.x * distMag * 1.5, upY), 0.0).rgb;
  // With no real environment to mirror, the reflection is a cool sky tint
  // brightened by how bright the scene above the puddle is (so reflected lights
  // still read) — this avoids banding the plate's own content into the puddle.
  let skyTint = vec3<f32>(0.55, 0.64, 0.80);
  let reflCol = skyTint * (0.55 + 0.9 * luminance(aboveCol)) + skyTint * ripSlope * 0.5;

  // Fresnel: rises toward the grazing far edge and on tilted ripple flanks.
  let fres = clamp(mix(0.06, 0.9, grazing * grazing) + fresnelTilt(n) * 0.8, 0.0, 1.0);

  let waterCol = mix(refrCol, reflCol, fres);
  var col = mix(base, waterCol, wetAmt);
  let lum = luminance(col);
  col = mix(vec3<f32>(lum), col, 1.0 + params.saturationShift * wetAmt);

  // ---- specular glint (Blinn-Phong; view looks straight down at the film) ----
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.55));
  let halfV = normalize(lightDir + vec3<f32>(0.0, 0.0, 1.0));
  let spec = pow(max(dot(n, halfV), 0.0), mix(18.0, 220.0, 1.0 - clamp(params.specularWidth, 0.0, 1.0)));
  col = col + spec * params.specularGain * (0.4 + 0.7 * wetAmt);

  // ---- reflective pooling: standing water is more mirror-like + glints harder.
  col = mix(col, reflCol, pool * 0.4 * params.poolHighlight);
  col = col + params.poolHighlight * 0.4 * pool * spec;

  // ---- flow streaks (subtle directional smear on the wet sheen) ----
  let streak = sin((surfUV.x * flow.y - surfUV.y * flow.x) * 60.0) * 0.5 + 0.5;
  col = col * (1.0 - params.flowStreakStrength * 0.06 * streak * wetAmt);

  // ---- edge bead near mask boundary ----
  let beadL = textureSampleLevel(maskTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).r;
  let beadR = textureSampleLevel(maskTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).r;
  let edge = abs(beadR - beadL);
  col = col + params.edgeBead * 0.3 * edge * wetAmt;

  col = col * params.visualGain;
  return vec4<f32>(encodeOut(col), 1.0);
}
