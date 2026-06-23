// flow_build.wgsl — construct the visual flow field (build plan §16.2):
//   flow = baseFlow + explicitBias
//        - flowDeflection * gradient(reliefHeight)
//        + boundaryWrap * tangent(reliefBoundary)
// The boundary-wrap term is deliberately art-directed so water visibly divides
// around a raised intake even when the derived field would read weakly.

struct FlowConfig {
  baseFlow: vec2<f32>,
  bias: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> flowConfig: FlowConfig;
@group(0) @binding(2) var reliefTex: texture_2d<f32>;  // R height, GB gradient, A mag
@group(0) @binding(3) var maskTex: texture_2d<f32>;
@group(0) @binding(4) var linSamp: sampler;
@group(0) @binding(5) var flowOut: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dim = textureDimensions(flowOut);
  if (gid.x >= dim.x || gid.y >= dim.y) {
    return;
  }
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));

  let relief = textureSampleLevel(reliefTex, linSamp, uv, 0.0);
  let grad = relief.yz;
  let mag = relief.w;

  var flow = flowConfig.baseFlow + flowConfig.bias;

  // deflect downhill away from raised relief
  flow = flow - params.flowDeflection * grad;

  // boundary wrap: tangent to the relief gradient (perpendicular), strongest near
  // the boundary where |grad| is large.
  let tangent = vec2<f32>(-grad.y, grad.x);
  let wrapWeight = params.boundaryWrap * clamp(mag * 0.5, 0.0, 1.0);
  // choose the tangent side that routes around the feature
  let side = sign(dot(tangent, flowConfig.baseFlow) + 1e-4);
  flow = flow + tangent * wrapWeight * side;

  let mask = textureSampleLevel(maskTex, linSamp, uv, 0.0).r;
  flow = flow * step(0.01, mask);

  let m = length(flow);
  textureStore(flowOut, vec2<i32>(i32(gid.x), i32(gid.y)),
    vec4<f32>(flow.x, flow.y, m, 0.0));
}
