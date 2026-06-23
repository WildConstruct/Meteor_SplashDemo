// relief_gradient.wgsl — derive relief gradient + magnitude from the relief
// height texture (build plan §16.1 steps 4-5). Input R = height (CPU-rasterized
// in the demo); output packs R=height, G=grad.x, B=grad.y, A=|grad|.

@group(0) @binding(0) var reliefIn: texture_2d<f32>;
@group(0) @binding(1) var linSamp: sampler;
@group(0) @binding(2) var reliefOut: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dim = textureDimensions(reliefOut);
  if (gid.x >= dim.x || gid.y >= dim.y) {
    return;
  }
  let texel = 1.0 / vec2<f32>(f32(dim.x), f32(dim.y));
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) * texel;

  let hl = textureSampleLevel(reliefIn, linSamp, uv - vec2<f32>(texel.x, 0.0), 0.0).r;
  let hr = textureSampleLevel(reliefIn, linSamp, uv + vec2<f32>(texel.x, 0.0), 0.0).r;
  let hd = textureSampleLevel(reliefIn, linSamp, uv - vec2<f32>(0.0, texel.y), 0.0).r;
  let hu = textureSampleLevel(reliefIn, linSamp, uv + vec2<f32>(0.0, texel.y), 0.0).r;
  let h = textureSampleLevel(reliefIn, linSamp, uv, 0.0).r;

  let grad = vec2<f32>((hr - hl) * 0.5, (hu - hd) * 0.5) / texel;
  let mag = length(grad);
  textureStore(reliefOut, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(h, grad.x, grad.y, mag));
}
