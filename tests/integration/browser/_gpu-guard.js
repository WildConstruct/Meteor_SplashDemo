// Skip browser GPU tests gracefully when the runner has no working WebGPU adapter
// (build plan §24.3). Used by integration + visual specs.

export async function hasWebGPU(page) {
  return page.evaluate(async () => {
    if (!('gpu' in navigator)) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  });
}

export async function waitForReady(page, timeout = 20000) {
  await page.waitForFunction(() => window.__meteorReady === true || window.__meteorError, null, { timeout });
  const err = await page.evaluate(() => window.__meteorError);
  return err;
}
