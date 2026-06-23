# Meteor Demo — Architecture & Decision Notes

Browser-first WebGPU implementation of the Meteor static-plate splash demo. This
document records the architecture and every deliberate deviation from the build
plan (`docs` are required by Milestone 0).

## Layering (non-negotiable)

```
src/client/   browser host + editor + UI + file I/O   (owns navigator.gpu, canvas, DOM, rAF)
src/engine/   host-neutral WebGPU engine + sim + math  (receives device/queue/views/time)
src/engine/shaders/  physical WGSL source files        (validated by naga + Metal)
```

- The engine **receives** a `GPUDevice`, `GPUQueue`, input `GPUTextureView`,
  output `GPUTextureView`, output format, explicit time/frame, parameters, and
  project state. It never calls `navigator.gpu`, configures a canvas, loads a
  file, reads the DOM, or schedules frames.
- Enforced automatically by `scripts/check-boundaries.mjs` (part of `npm test`).
  WebGPU types are allowed in the engine; browser *acquisition* of them is not.

## Frame graph (`MeteorEngine`, build plan §20)

```
linearize (sRGB plate -> linear rgba16float)
  └─ per surface, advance wet-state to the target sim step:
       deposit_stamp (compute) -> wet_update (compute, ping-pong)
       (checkpointed seek: nearest checkpoint + fixed-step replay)
  └─ per surface composite (wet_composite, linear) ping-pong
  └─ splash (instanced, additive) + droplets (instanced, additive)
  └─ final encode (wet_composite, disabled surface, linear -> sRGB output)
```

Relief is rasterized on the CPU (`ReliefShapes.js`) and uploaded once per
topology change; `relief_gradient` (GPU) derives gradients and `flow_build` (GPU)
builds the flow field including the art-directed boundary-wrap term.

## Determinism

- `SeededHash.js` (CPU) and `common.wgsl` (`hash_u32`/`combine`/`rand01`) use the
  identical lowbias32 finalizer so CPU event records match GPU evaluation.
- Rain fields hold a fixed canonical candidate pool; density selects a stable
  prefix (monotonic); transform only maps the same points. Response/placement use
  independent streams. Verified by `tests/unit/engine/rainField.test.js`.
- Wet-state seeking uses immutable GPU checkpoints + fixed-step replay
  (`WetStateTimeline.js`, `CheckpointCache.js`).

## Deviations from the build plan (and why)

1. **Package lives at the repository root**, not nested under
   `meteor-webgpu-demo/`. This repo is dedicated to exactly this demo; nesting
   added no value. All §6 sub-paths are preserved under `src/`.
2. **No reuse of OTIS / Entropy / shared WC `params`·`ui`·preset-manager.** The
   GitHub scope for this session is restricted to `Meteor_SplashDemo`, so those
   sources were not reachable. We implemented self-contained equivalents that
   preserve the **contracts** exactly:
   - `plugin.params.json` with the `_manifest` + permanent UUIDs;
   - the canonical `.wcx` header (`_format`/`_plugin`/`_wcxVersion`) and
     UUID-authoritative resolution (`MeteorPresetAdapter.js`).
   These drop onto the shared WC modules later without changing the on-disk
   format. See `dawn-handoff.md` §"Shared-module reuse".
3. **JavaScript (not TypeScript).** The sibling browser WebGPU repo
   (`muggle-ammunition`) is JavaScript and the plan says not to introduce TS
   solely for Meteor. JSDoc types are used at boundaries.
4. **Ripple is merged into `wet_update`** for one fewer ping-pong in the browser.
   `ripple_update.wgsl` is kept valid + Metal-portable as the separable form for
   the Dawn port.
5. **Relief is CPU-rasterized + uploaded** (documented §16/§28 fallback);
   `relief_raster.wgsl` is the GPU form kept valid for Dawn.
6. **Editor tool files** are render-only modules; all pointer interaction is
   centralized in `editor/EditorController.js` (not in the §6 list) to avoid
   duplicating drag logic across tools.

## Known limitations in this environment

- This build was produced in a headless container with **no GPU and no browser**.
  Consequently the WebGPU runtime path (device init, pipeline execution, visual
  output) could not be executed here. What *was* verified: all CPU unit/
  serialization tests (36), `naga --validate` + Metal translation for all 12
  shaders, the boundary check, the `.wcx` gate, and a full `vite build`.
- The browser integration (`tests/integration/browser`) and visual
  (`tests/visual`) specs are written and wired into `playwright.config.js`; they
  auto-skip where no WebGPU adapter exists and should be run on Apple-Silicon /
  Chrome to capture goldens and confirm runtime behavior.
- The bundled plate is a **synthetic** stand-in (`scripts/make-demo-assets.mjs`),
  not a photograph. Replace `public/assets/demo/car-hood-demo.png` or use the
  image-upload path with a real plate.
