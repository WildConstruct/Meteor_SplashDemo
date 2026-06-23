import { defineConfig } from '@playwright/test';

// Browser GPU integration + visual tests run against real Chrome with WebGPU.
// These are skipped automatically on machines without a working GPU adapter
// (see tests/integration/browser/_gpu-guard.js).
export default defineConfig({
  testDir: 'tests',
  testMatch: ['integration/browser/**/*.spec.js', 'visual/**/*.spec.js'],
  fullyParallel: false,
  workers: 1,
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    launchOptions: {
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=Vulkan',
        '--use-angle=vulkan',
      ],
    },
  },
});
