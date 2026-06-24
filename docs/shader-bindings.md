# Shader Bindings & Uniform Layouts

Authoritative binding reference for the Dawn port. All shaders are prepended with
`common.wgsl` at module creation (`MeteorEngine._init`) and at validation
(`scripts/validate-wgsl.mjs`). Group is always `@group(0)`.

## Uniform / storage struct byte layouts

### `Params` (uniform, 31 scalars; buffer 128 B, write 32×f32)
Field order MUST equal `ParameterState.WGSL_PARAM_IDS` (manifest order of params
that have a `wgsl` binding). Packed by `ParameterState.packUniform()`:

```
0 debugMode      1 visualGain     2 impactVelocity  3 splashHeight
4 splashWidth    5 bounce         6 spread          7 lifetime
8 flowSpeed      9 evaporation   10 reliefHeight   11 reliefSoftness
12 flowDeflection 13 boundaryWrap 14 wetDarkening  15 saturationShift
16 specularGain  17 specularWidth 18 specularDirection 19 microNormalStrength
20 flowStreakStrength 21 rippleNormalStrength 22 poolHighlight 23 distortion
24 edgeBead       25 dropletScale  26 waterLevel
27 puddleAmount   28 puddleScale    29 puddleEdge
```

### `Frame` (uniform, 32 B) — `packFrame()`
```
offset 0  resolution.x (f32)
offset 4  resolution.y (f32)
offset 8  pixelAspect  (f32)
offset 12 timeSeconds  (f32)
offset 16 frameIndex   (f32)   timeline frames (NOT sim steps)
offset 20 globalSeed   (f32)
offset 24 simDt        (f32)   = 1/30
offset 28 debugMode    (f32)
```

### `Surface` (uniform, 112 B) — `packSurface()`
```
0   homographyFwd  mat3x3<f32> (48 B, 3×vec3 @16B stride; surface UV -> image UV)
48  homographyInv  mat3x3<f32> (48 B; image UV -> surface UV)
96  normalDir      vec2<f32>   (screen-space displacement per unit splash height)
104 enabled        f32
108 simResolution  f32
```
`packMat3` stores column-major (column j = rows 0..2 of input column j), padded.

### `Impact` (storage element, 64 B = 16×f32) — `packImpacts()`
```
0  surfaceUV.x      4  surfaceUV.y     8  birthFrame     12 dropSize
16 responseIndex   20 incomingVelocity 24 responseSeed   28 visualGain
32 heightOv        36 widthOv         40 bounceOv        44 spreadOv
48 lifetimeOv (FRAMES) 52 rippleImpulse 56 wetnessDeposit 60 waterDeposit
```
`lifetimeOv` is the effective lifetime baked into FRAMES. Deposit/ripple/water
values are effective (response × global). Use `arrayLength(&impacts)` for count.

### `CompositeConfig` (uniform, 16 B) — `packCompositeConfig()`
```
0 encode (f32; 1 => linear->sRGB output)   4,8,12 pad
```

### `FlowConfig` (uniform, 16 B) — `packFlowConfig()`
```
0 baseFlow.x  4 baseFlow.y  8 bias.x  12 bias.y
```

## Per-shader bind groups

> **Explicit layouts (Dawn/Tint pruning).** Two bindings below are part of the
> contract but are not *statically sampled* by the current WGSL: `wet_composite`
> binding 0 (`Frame`) and `wet_update` binding 5 (`reliefTex`). Dawn/Tint prunes
> unused bindings from a `layout:'auto'` pipeline, after which `createBindGroup`
> fails with *"binding index N not present in the bind group layout"* (cascading
> into a flood of "Invalid RenderPipeline" errors in-browser). naga does no such
> pruning, so the CI gate misses it. `MeteorEngine._createPipelines` therefore
> pins **explicit** `GPUBindGroupLayout`/`GPUPipelineLayout` for `wet_update` and
> `wet_composite`, keeping these binding numbers stable for the Dawn port. A Dawn
> host should likewise use explicit layouts. Reproduce locally against real Tint
> with `node scripts/headless-render.mjs` (needs `npm i -D @kmamal/gpu`).

| shader | binding → resource |
|---|---|
| `plate_linearize` (render) | 0 inputTex `texture_2d<f32>`, 1 sampler |
| `deposit_stamp` (compute) | 0 Frame, 1 Params, 2 impacts (storage ro), 3 depositTex `storage rgba16float write` |
| `wet_update` (compute) | 0 Frame, 1 Params, 2 stateIn, 3 deposit, 4 flow, 5 relief, 6 mask, 7 sampler, 8 stateOut `storage write` |
| `ripple_update` (compute, Dawn-only) | 0 Frame, 1 Params, 2 stateIn, 3 deposit, 4 sampler, 5 stateOut `storage write` |
| `relief_gradient` (compute) | 0 reliefIn, 1 sampler, 2 reliefOut `storage write` |
| `flow_build` (compute) | 0 Params, 1 FlowConfig, 2 reliefTex, 3 maskTex, 4 sampler, 5 flowOut `storage write` |
| `relief_raster` (compute, Dawn-only) | 0 Params, 1 shapes (storage ro), 2 reliefOut `storage write` |
| `wet_composite` (render) | 0 Frame, 1 Params, 2 Surface, 3 colorIn, 4 stateTex, 5 reliefTex, 6 flowTex, 7 maskTex, 8 microTex, 9 sampler, 10 CompositeConfig |
| `splash` (render, instanced, additive) | 0 Frame, 1 Params, 2 Surface, 3 impacts (storage ro) |
| `droplets` (render, instanced, additive) | 0 Frame, 1 Params, 2 Surface, 3 impacts (storage ro) |
| `debug` (render, Dawn-only) | 0 Frame, 1 stateTex, 2 sampler |

## Texture formats (build plan §17)

| texture | format | usage |
|---|---|---|
| input plate | `rgba8unorm` | TEXTURE_BINDING, COPY_DST, RENDER_ATTACHMENT |
| working/color | `rgba16float` | RENDER_ATTACHMENT, TEXTURE_BINDING |
| stateA/stateB | `rgba16float` (R wet, G water, B rippleH, A rippleV) | TEXTURE_BINDING, STORAGE_BINDING, COPY_SRC/DST |
| deposit | `rgba16float` (R wet, G water, B ripple) | TEXTURE_BINDING, STORAGE_BINDING |
| relief / reliefRaw | `rgba16float` (R height, G/B grad, A mag) | TEXTURE_BINDING (+STORAGE for relief) |
| flow | `rgba16float` (R/G flow, B mag) | TEXTURE_BINDING, STORAGE_BINDING |
| mask | `r8unorm` | TEXTURE_BINDING, COPY_DST |
| checkpoints | `rgba16float` | COPY_SRC/DST, TEXTURE_BINDING (immutable) |

Workgroup size for all compute passes is `8×8×1`.
