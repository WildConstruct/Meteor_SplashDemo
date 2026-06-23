// relief_raster.wgsl — GPU rasterization of relief shapes into the height texture
// (build plan §16.1). The browser demo currently rasterizes relief on the CPU
// (src/engine/geometry/ReliefShapes.js) and uploads the result; this GPU form is
// kept valid + Metal-portable for the Dawn bridge. Shapes are supplied as a
// storage buffer of ellipse/polygon-bbox primitives.

struct ReliefShape {
  center: vec2<f32>,
  radius: vec2<f32>,
  rotation: f32,
  height: f32,
  softness: f32,
  mode: f32, // 0 raised, 1 depression, 2 ridge
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> shapes: array<ReliefShape>;
@group(0) @binding(2) var reliefOut: texture_storage_2d<rgba16float, write>;

fn smooth01(a: f32, b: f32, x: f32) -> f32 {
  let t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dim = textureDimensions(reliefOut);
  if (gid.x >= dim.x || gid.y >= dim.y) {
    return;
  }
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));

  var h = 0.0;
  let count = arrayLength(&shapes);
  for (var i = 0u; i < count; i = i + 1u) {
    let s = shapes[i];
    let co = cos(-s.rotation);
    let si = sin(-s.rotation);
    let lx = (uv.x - s.center.x) * co - (uv.y - s.center.y) * si;
    let ly = (uv.x - s.center.x) * si + (uv.y - s.center.y) * co;
    let k = length(vec2<f32>(lx / s.radius.x, ly / s.radius.y));
    let sd = (k - 1.0) * min(s.radius.x, s.radius.y);
    let soft = max(1e-3, s.softness);
    var profile = smooth01(soft, -soft, sd); // 1 inside -> 0 outside
    if (s.mode > 1.5) {
      profile = max(0.0, 1.0 - abs(sd) / soft); // ridge band
    } else if (s.mode > 0.5) {
      profile = -profile; // depression
    }
    h = h + profile * s.height;
  }

  textureStore(reliefOut, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(h * params.reliefHeight, 0.0, 0.0, 0.0));
}
