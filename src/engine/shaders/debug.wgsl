// debug.wgsl — standalone debug-view overlay (build plan §4 step 14). For the
// browser demo the debug visualizations are produced inside wet_composite.wgsl
// (it already has surface UV + all state textures bound); this standalone pass is
// kept valid + Metal-portable as the separable Dawn form, and can render any
// single state texture directly to the output.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var stateTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  return fullscreen_vertex(vid);
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let s = textureSample(stateTex, samp, in.uv);
  let mode = frame.debugMode;
  var rgb = s.rgb;
  if (mode < 3.5) {
    rgb = vec3<f32>(s.r * 0.5);            // wetness
  } else if (mode < 6.5) {
    rgb = vec3<f32>(0.0, s.g * 0.5, s.g);  // pool
  } else {
    rgb = vec3<f32>(s.b * 0.5 + 0.5);      // ripple
  }
  return vec4<f32>(linear_to_srgb(rgb), 1.0);
}
