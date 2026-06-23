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

  // ---- perturbed normal from ripple gradient + micro-normal ----
  let texel = 1.0 / max(surface.simResolution, 16.0);
  let rl = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).b;
  let rr = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).b;
  let rd = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(0.0, texel), 0.0).b;
  let ru = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(0.0, texel), 0.0).b;
  var n = vec3<f32>(-(rr - rl) * params.rippleNormalStrength,
                    -(ru - rd) * params.rippleNormalStrength, 1.0);
  let micro = textureSampleLevel(microTex, samp, surfUV * 6.0, 0.0).xy * 2.0 - 1.0;
  n = normalize(n + vec3<f32>(micro * params.microNormalStrength * wet, 0.0));

  // ---- distortion (refraction) ----
  let distort = (n.xy + flow * 0.5) * params.distortion * 0.02 * clamp(water, 0.0, 1.0);
  base = textureSampleLevel(colorIn, samp, imgUV + distort, 0.0).rgb;

  let wetAmt = clamp(wet, 0.0, 1.0);
  var col = base;

  // ---- darkening + saturation shift ----
  col = col * (1.0 - params.wetDarkening * 0.35 * wetAmt);
  let lum = luminance(col);
  col = mix(vec3<f32>(lum), col, 1.0 + params.saturationShift * wetAmt);

  // ---- specular ----
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.8));
  let spec = pow(max(dot(n, lightDir), 0.0), mix(64.0, 8.0, clamp(params.specularWidth, 0.0, 1.0)));
  col = col + spec * params.specularGain * wetAmt;

  // ---- flow streaks ----
  let streak = sin((surfUV.x * flow.y - surfUV.y * flow.x) * 80.0) * 0.5 + 0.5;
  col = col * (1.0 - params.flowStreakStrength * 0.1 * streak * wetAmt);

  // ---- pool highlight ----
  col = col + params.poolHighlight * 0.2 * clamp(water, 0.0, 1.0) * spec;

  // ---- edge bead near mask boundary ----
  let beadL = textureSampleLevel(maskTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).r;
  let beadR = textureSampleLevel(maskTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).r;
  let edge = abs(beadR - beadL);
  col = col + params.edgeBead * 0.3 * edge * wetAmt;

  col = col * params.visualGain;
  return vec4<f32>(encodeOut(col), 1.0);
}
