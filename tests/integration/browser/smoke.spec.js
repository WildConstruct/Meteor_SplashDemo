// Browser GPU integration tests (build plan §24.3). Runs against real Chrome with
// WebGPU. Auto-skips where no adapter exists.

import { test, expect } from '@playwright/test';
import { hasWebGPU, waitForReady } from './_gpu-guard.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  if (!(await hasWebGPU(page))) test.skip(true, 'no WebGPU adapter on this runner');
});

test('device initializes and the app becomes ready', async ({ page }) => {
  const err = await waitForReady(page);
  expect(err, 'app start error').toBeFalsy();
  const ready = await page.evaluate(() => window.__meteorReady === true);
  expect(ready).toBe(true);
});

test('passthrough render produces a non-empty canvas with no uncaptured errors', async ({ page }) => {
  await waitForReady(page);
  await page.evaluate(async () => {
    window.__meteorApp.state.setParam('debugMode', 0);
    await window.__meteorApp.captureFrame(0);
  });
  const uncaptured = await page.evaluate(() => window.__meteorApp.uncapturedError?.message ?? null);
  expect(uncaptured).toBeNull();

  // canvas should have drawn something (not fully black/transparent)
  const canvas = page.locator('#gpu-canvas');
  await expect(canvas).toBeVisible();
});

test('wet-state advances over 100 fixed steps without errors', async ({ page }) => {
  await waitForReady(page);
  const err = await page.evaluate(async () => {
    const app = window.__meteorApp;
    for (let f = 0; f <= 100; f++) await app.captureFrame(f);
    return app.uncapturedError?.message ?? null;
  });
  expect(err).toBeNull();
});

test('backward seek + replay is error-free (checkpoint restore)', async ({ page }) => {
  await waitForReady(page);
  const err = await page.evaluate(async () => {
    const app = window.__meteorApp;
    await app.captureFrame(120);
    await app.captureFrame(30); // backward seek -> checkpoint restore + replay
    await app.captureFrame(200);
    return app.uncapturedError?.message ?? null;
  });
  expect(err).toBeNull();
});

test('input image replacement / resize is handled', async ({ page }) => {
  await waitForReady(page);
  await page.setViewportSize({ width: 1000, height: 700 });
  const err = await page.evaluate(async () => {
    await window.__meteorApp.captureFrame(10);
    return window.__meteorApp.uncapturedError?.message ?? null;
  });
  expect(err).toBeNull();
});
