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

  // ---- perturbed normal from ripple gradient + micro-normal ----
  let texel = 1.0 / max(surface.simResolution, 16.0);
  let rl = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).b;
  let rr = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).b;
  let rd = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(0.0, texel), 0.0).b;
  let ru = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(0.0, texel), 0.0).b;
  let ripGrad = vec2<f32>(rr - rl, ru - rd);
  let ripSlope = length(ripGrad);
  var n = vec3<f32>(-ripGrad * params.rippleNormalStrength * 2.0, 1.0);
  let micro = textureSampleLevel(microTex, samp, surfUV * 6.0, 0.0).xy * 2.0 - 1.0;
  n = normalize(n + vec3<f32>(micro * params.microNormalStrength * 0.5 * wetAmt, 0.0));

  // ---- refraction: a wet film bends the view of the plate beneath it ----
  let distort = (n.xy + flow * 0.4) * params.distortion * 0.03 * (0.3 + 0.7 * pool);
  let refr = textureSampleLevel(colorIn, samp, imgUV + distort, 0.0).rgb;
  var col = mix(base, refr, wetAmt);

  // ---- wet substrate: a wet surface is much DARKER and more saturated ----
  col = col * (1.0 - params.wetDarkening * 0.72 * wetAmt);
  let lum = luminance(col);
  col = mix(vec3<f32>(lum), col, 1.0 + params.saturationShift * wetAmt);

  // ---- mirror reflection: bright areas of the plate are reflected light
  // sources; on a wet film they reflect back strongly and ride the ripple
  // normal. This is what sells "wet" — the reflected highlights pop. ----
  let reflLum = luminance(refr);
  let reflectMask = smoothstep(0.30, 0.95, reflLum);
  col = col + refr * reflectMask * wetAmt * (1.1 + 0.6 * fresnelTilt(n));

  // ---- glossy reflection: sharp sun glint + Fresnel sky sheen ----
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.85));
  let ndl = max(dot(n, lightDir), 0.0);
  let spec = pow(ndl, mix(110.0, 16.0, clamp(params.specularWidth, 0.0, 1.0)));
  let fresnel = fresnelTilt(n);                       // brightens tilted ripple flanks
  let sheen = vec3<f32>(0.55, 0.62, 0.72);            // cool sky tint
  col = col + spec * params.specularGain * (0.6 + 0.8 * wetAmt);
  col = col + sheen * fresnel * 0.9 * wetAmt;

  // ---- concentric ripple rings: bright leading rim + dark trough where the
  // wave slope is steep (reads as raindrop rings spreading on the puddle) ----
  let ring = clamp(ripSlope * params.rippleNormalStrength * 3.5, 0.0, 1.5);
  col = col + vec3<f32>(0.80, 0.85, 0.95) * ring * wetAmt;
  col = col * (1.0 - 0.25 * clamp(rippleH, 0.0, 1.0) * wetAmt); // trough darkening

  // ---- reflective pooling: standing water reads near-mirror + brighter glint ----
  col = mix(col, col + sheen * 0.5, pool * 0.5);
  col = col + params.poolHighlight * 0.6 * pool * (spec + 0.1);

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
