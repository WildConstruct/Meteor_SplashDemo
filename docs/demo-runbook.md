# Demo Runbook (build plan §4)

How to run the demo and reproduce the required product-proof sequence.

## Run

```bash
npm install
npm run assets        # generate the synthetic plate + normal + splash atlas (once)
npm run dev           # open the printed URL in Chrome/Edge 113+ (WebGPU)
```

Build / validate:

```bash
npm test              # boundary check + WGSL naga+Metal + .wcx gate + unit tests
npm run build         # production bundle
npm run test:browser  # Playwright GPU + visual specs (needs a WebGPU browser)
```

## The required sequence (§4) → UI actions

1. **Open the demo project** — loads automatically on start. (Project menu →
   *Reload Demo* to reset.)
2. **Select the Hood surface** — click the `Hood` chip in the Chip Stack.
3. **See its mask, perspective quad, grid, normal** — overlaid on the hood; drag
   `A·B·C·D` to recalibrate, drag `N` to aim the splash normal.
4. **Select `Focused Hood Rain` and drag it toward the intake** — click the
   `🌧 Focused Hood Rain` chip, then drag the blue center handle on the hood.
5. **Increase density** — the field inspector (top-left) *Density* slider. New
   dots appear; existing dot IDs/positions stay put (deterministic prefix).
6. **Increase Splash Height and Bounce** — Parameters → *Splash* section.
7. **Mix Metal Tick + Metal Bounce** — field inspector *Palette* → `Metal Mix`.
   Impacts do not move (independent response stream).
8. **Enable the Raised Intake relief** — click the relief chip under Hood
   (`⛰ Relief: raised (off) — click to toggle`). Wetness/streaks divide around it.
9. **Promote an impact to hero** — click an impact dot, then *★ Promote to Hero*
   in the inspector.
10. **Move & retime the hero, exaggerate height** — drag the orange ★ dot; use
    the inspector *Frame* / *Height ×* sliders.
11. **Ground surface puddle response** — select the `Ground` chip / its field; it
    already uses the `Puddle` palette (softer, wider).
12. **Play / pause / scrub / jump / reset / replay** — transport bar at the
    bottom (Space toggles play). Drag the scrubber to seek backward (checkpoint
    replay).
13. **Save a look + export project, reload both** — *Save .wcx* (top bar) and
    *Export Project*; reload via *Import .wcx* / *Import Project*. Same preset +
    project + frame reproduces the result.
14. **Toggle debug views** — Debug & Simulation → *Debug View*: surface UV,
    impact IDs, wetness, relief, flow, pool, ripple, mask.

## Notes

- The bundled plate is synthetic. Replace
  `public/assets/demo/car-hood-demo.png` with a real locked-off car-and-ground
  plate (matching the hood/ground masks, or recalibrate the quads).
- If WebGPU is unavailable you'll see the unsupported message (no WebGL
  fallback, by design).
