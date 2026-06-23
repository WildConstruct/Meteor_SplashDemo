# Dawn Handoff (build plan §27)

Everything a later After Effects / Wild Construct Dawn bridge needs to wrap the
Meteor engine without rediscovering the browser architecture. **No Dawn or AE code
exists in this repo by design** — this is the contract for that future task.

## 1. Engine host contract

```js
const engine = await MeteorEngine.create({ device, queue, outputFormat, shaderSources, diagnostics });
engine.setParameters(parameterStateOrObject);
engine.setProject(projectJson);
engine.registerAssets({ microNormal /* GPUTexture */ });
engine.resize({ width, height, pixelAspect });
engine.render({ inputTextureView, outputTextureView, width, height, pixelAspect,
                frameIndex, timeSeconds, frameRate, renderQuality, debugMode });
engine.resetSimulation({ surfaceId|null });
engine.dispose();
```

The Dawn host must supply: `GPUDevice`, `GPUQueue`, an input `GPUTextureView`
(the AE layer/plate), an output `GPUTextureView` (the effect result surface), the
**output format** (injected — never hard-coded), explicit `frameIndex`/
`timeSeconds`/`frameRate`, pixel dimensions + aspect, and serialized
parameter/project state. The engine returns structured diagnostics, never throws
across the boundary.

## 2. WGSL inventory (all pass `naga --validate` + Metal `--metal-version 2.1`)

`common.wgsl` (include fragment), `plate_linearize`, `deposit_stamp`,
`wet_update`, `ripple_update`*, `relief_raster`*, `relief_gradient`, `flow_build`,
`wet_composite`, `splash`, `droplets`, `debug`*.
(* = kept valid + portable; the browser demo uses the merged/CPU path — see
`architecture.md` deviations. The Dawn host may switch to the separable forms.)

## 3. Bindings, formats, byte layouts

See `shader-bindings.md` (binding tables, struct byte offsets, texture formats,
workgroup sizes). `Params` field order is locked to
`ParameterState.WGSL_PARAM_IDS`.

## 4. Pass ordering & invalidation

Frame graph in `architecture.md`. Invalidation rules:
- relief/flow rebuilt only on **surface topology** change
  (`surfaceTopologyHash`);
- wet-state advanced only when time or history changes;
- wet-state history invalidated when the **cache key** changes
  (`buildCacheKey`: schema, topology, history-affecting params, sim resolution,
  frame rate, seed).

## 5. Time & checkpoint semantics

- Fixed `SIM_HZ = 30`. `SimulationClock.simStepForFrame(frame)` maps timeline
  frames → integer sim steps.
- Stateless components (impacts, droplets, hero, debug dots) evaluate directly
  from frame/time. The wet map uses checkpointed replay: immutable checkpoints
  every 30 sim steps; backward/random seek restores the nearest earlier
  checkpoint and replays fixed steps (`WetStateTimeline.planSeek`).
- No frame-loop GPU readback anywhere. Thumbnail capture (if added) must be a
  one-time save-time readback (build plan §10.3).

## 6. Color & premultiplication (build plan §19)

- Input plate sampled as raw sRGB bytes (`rgba8unorm`); `plate_linearize`
  converts to linear `rgba16float`.
- All wet compositing/diffusion happens in linear light.
- Final encode (`wet_composite` with `CompositeConfig.encode=1`) does
  `linear_to_srgb` to the injected output format.
- Splash/droplet passes output **premultiplied** color with additive blend
  (`src=one, dst=one`).
- AE note: AE 16/32-bit float layers are already linear-ish; the Dawn host should
  skip `plate_linearize` (or feed a linear input view) and set the output encode
  flag to match the AE working space. This is the main known browser↔AE
  difference (browser assumes sRGB 8-bit canvas in/out).

## 7. Assets & tokenized paths

- `public/assets/demo/car-hood-demo.png` (synthetic plate; replaceable)
- `public/assets/normals/wet-micro-normal.png`
- `public/assets/splashes/splash-atlas.png` + `.json` (4 entries: metal-tick,
  metal-bounce, puddle-crown, hero-splash)
- Project references the plate by **assetId token** (`sourcePlate.assetId`), never
  by embedded bytes (build plan §9.2).

## 8. Parameters → WGSL

`plugin.params.json` is the stable registry; UUIDs are permanent
(`scripts/gen-params.mjs` refuses to regenerate). `aeDiskId` reserves AE
parameter slots. The `wgsl` field on a param maps it into the `Params` struct
(order = `WGSL_PARAM_IDS`). `historyAffecting` marks params that invalidate
wet-state history.

## 9. `.wcx` factory presets

`directed-metal-hood.wcx`, `subtle-wet-metal.wcx`, `heavy-puddle.wcx` — canonical
header (`_format:"wcx"`, `_plugin:"meteor"`, `_wcxVersion:1`), UUID-authoritative
with id fallback. Generated from the manifest by
`scripts/make-factory-presets.mjs`; validated by `scripts/validate-wcx.mjs`.

## 10. Project schema & migration

`MeteorProject` schema v1 (`ProjectSchema.js`): surfaces (mask, calibration quad,
homography, normal, relief layers, rain fields), palettes, hero events, duration,
frame rate, seed. Migration registry keyed by version; `migrateProject` upgrades
to current. Validation returns errors + warnings (never silent corruption).

## 11. Deterministic test vectors

- `hashU32(0)=0`, `hashU32(1)=0x688990c0`, `hashU32(2)=0xd1132181` (lock the
  CPU↔WGSL hash). A Dawn implementation must reproduce these in WGSL.
- Rain-field determinism, density monotonicity, palette independence, hero
  suppression, homography round-trip, cache-key classification, `.wcx` UUID
  resolution — all in `tests/`.

## 12. Visual golden frames

`tests/visual/visual.spec.js` captures frames 0/30/90/150/210 (clean, impacts,
hood wet, relief split, hero) + a debug-wetness view. Run on a WebGPU browser to
generate goldens; store under `tests/visual/__screenshots__`.

## 13. Browser-only components that must NOT move into Dawn

`BrowserHost`, `BrowserAssetLoader`, `ShaderSourceManifest`, `TimelineController`/
`PlaybackClock`, everything in `client/editor/` and `client/ui/`, and the file
I/O in `client/serialization/`. The Dawn bridge supplies its own host, asset
upload, time source, parameter UI, and preset storage.

## 14. Engine responsibilities to mirror in the bridge

Pipeline/layout creation, the frame graph + pass ordering, fixed-step wet-state
with checkpointed seek, deterministic impact generation, response baking, uniform
packing (`gpu/Packing.js`), and resource lifetime (`TexturePool`,
`UniformRing`). These are host-neutral and port directly.

## 15. OTIS capabilities the Meteor bridge will require

Multipass orchestration and **persistent inter-frame GPU state** (ping-pong state
textures + immutable checkpoints) — OTIS's single-pass model must be extended
with an explicit frame graph and persistent resource registry (build plan §28
"Current OTIS engine is single-pass"). Storage textures (`rgba16float` write),
storage buffers for impacts, and `instance_index` draws (MSL ≥ 2.1) are required.

## Port-readiness checklist (§27)

- [x] WGSL validates for Metal through naga
- [x] output format injected, not hard-coded
- [x] engine time explicit
- [x] engine has no DOM/browser dependencies (enforced by `check:boundaries`)
- [x] shaders/assets are physical files, not generated strings
- [x] persistent resource lifetime centralized (`TexturePool`/registries)
- [x] parameter IDs + UUIDs committed and stable
- [x] no frame-loop readback
- [x] test vectors re-runnable against a future Dawn implementation
