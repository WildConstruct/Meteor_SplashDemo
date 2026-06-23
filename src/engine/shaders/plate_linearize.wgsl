// plate_linearize.wgsl — sample the sRGB source plate and write a linear-light
// rgba16float working texture (build plan §19). All wet compositing happens in
// linear light; we re-encode only at final output.

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  return fullscreen_vertex(vid);
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let c = textureSample(inputTex, samp, in.uv);
  return vec4<f32>(srgb_to_linear(c.rgb), c.a);
}
