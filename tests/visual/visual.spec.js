// Visual regression tests (build plan §24.4). Captures fixed frames of the bundled
// demo and compares against goldens. First run writes goldens; CI compares with a
// calibrated threshold. Auto-skips without a WebGPU adapter.

import { test, expect } from '@playwright/test';
import { hasWebGPU, waitForReady } from '../integration/browser/_gpu-guard.js';

const FRAMES = [
  { frame: 0, name: 'frame-000-clean' },
  { frame: 30, name: 'frame-030-impacts' },
  { frame: 90, name: 'frame-090-hood-wet' },
  { frame: 150, name: 'frame-150-relief-split', relief: true },
  { frame: 210, name: 'frame-210-hero', hero: true },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  if (!(await hasWebGPU(page))) test.skip(true, 'no WebGPU adapter on this runner');
  await waitForReady(page);
});

for (const f of FRAMES) {
  test(`beauty ${f.name}`, async ({ page }) => {
    await page.evaluate(async (cfg) => {
      const app = window.__meteorApp;
      app.state.setParam('debugMode', 0);
      if (cfg.relief) app.state.setReliefEnabled('hood', true);
      // warm the simulation by stepping up to the target frame
      for (let i = 0; i <= cfg.frame; i += 5) await app.captureFrame(i);
      await app.captureFrame(cfg.frame);
    }, f);
    await expect(page.locator('#gpu-canvas')).toHaveScreenshot(`${f.name}.png`, {
      maxDiffPixelRatio: 0.04,
    });
  });
}

test('debug wetness view', async ({ page }) => {
  await page.evaluate(async () => {
    const app = window.__meteorApp;
    app.state.setParam('debugMode', 3); // wetness
    for (let i = 0; i <= 90; i += 5) await app.captureFrame(i);
    await app.captureFrame(90);
  });
  await expect(page.locator('#gpu-canvas')).toHaveScreenshot('debug-wetness.png', {
    maxDiffPixelRatio: 0.05,
  });
});
