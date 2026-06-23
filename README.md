# Meteor — Static-Plate Splash Demo (Browser WebGPU)

Art-directable environmental-interaction (rain / splash / wet-surface) VFX on a
still or locked-off plate. **Browser-first WebGPU/WGSL**, with a strict
`engine/` ↔ `client/` split designed to port to a Wild Construct Dawn / After
Effects host later (no AE/Dawn code in this phase).

> The artist defines where interaction reads, places a stable patch of rain
> impacts over a hood/ground, raises density without reshuffling identities, mixes
> impact looks, exaggerates splashes, builds a wet map that flows and divides
> around a raised intake, promotes a hero impact, and scrubs deterministically.

## Quick start

```bash
npm install
npm run assets     # generate the synthetic demo plate + textures (once)
npm run dev        # Chrome / Edge 113+ (WebGPU). No WebGL fallback by design.
```

## Layout

```
plugin.params.json        stable parameter registry (permanent UUIDs)
src/engine/               host-neutral WebGPU engine + sim + math + WGSL
src/client/               browser host, editor overlay, UI, timeline, file I/O
src/presets/factory/      .wcx factory look presets (canonical WC header)
public/assets/            bundled demo plate + normal + splash atlas
tests/                    unit, serialization, browser GPU, visual
scripts/                  validate-wgsl / validate-wcx / check-boundaries / assets
docs/                     architecture, dawn-handoff, shader-bindings, runbook
```

## Architecture rules (enforced)

- WebGPU/WGSL only — no WebGL/Three.js/Babylon.
- All reusable GPU + sim logic in `src/engine/`; it **receives** device, queue,
  input/output texture views, and explicit time. It never touches
  `navigator.gpu`, the canvas, the DOM, files, or `requestAnimationFrame`
  (`npm run check:boundaries`).
- Every WGSL file passes `naga --validate` **and** Metal translation
  (`npm run validate:wgsl`).
- `plugin.params.json` is the source of truth; `.wcx` look presets use the shared
  WC contract; scene state lives in versioned `.meteor.json`.

## Deploy (GitHub Pages)

Two paths:

- **GitHub Actions** (`.github/workflows/deploy-pages.yml`) — auto-deploys on push
  to `main`. Requires Actions runners enabled + Pages source = "GitHub Actions".
- **No Actions** (works when runners are unavailable):
  ```bash
  npm run deploy:ghpages    # builds with base=/Meteor_SplashDemo/ and pushes gh-pages
  ```
  Then enable once: Settings → Pages → "Deploy from a branch" → `gh-pages` / root.
  Live at `https://wildconstruct.github.io/Meteor_SplashDemo/`.

> Note: WebGPU is required at runtime — the deployed page shows the unsupported
> message in browsers without it.

## Testing

```bash
npm test              # boundary + WGSL(naga/Metal) + .wcx + 36 unit/serialization tests
npm run build         # production bundle
npm run test:browser  # Playwright GPU + visual (needs a WebGPU browser; auto-skips)
```

See **`docs/demo-runbook.md`** for the full §4 demo sequence and
**`docs/dawn-handoff.md`** for the port contract.
