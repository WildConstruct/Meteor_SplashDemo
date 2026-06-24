import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

// The browser client is the only application shell. WGSL files are imported as
// raw source strings (see src/client/ShaderSourceManifest.js) and handed to the
// host-neutral engine — they are never dynamically generated.
export default defineConfig({
  // GitHub Pages project sites serve under /<repo>/. Set BASE_PATH in CI; defaults
  // to '/' for local dev.
  base: process.env.BASE_PATH || '/',
  root: '.',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Two pages: index.html = the full Meteor editor/demo (site root),
      // tune.html = the standalone wet-shader tuning sandbox. Keep both.
      input: {
        index: r('index.html'),
        tune: r('tune.html'),
      },
    },
  },
  assetsInclude: ['**/*.wgsl', '**/*.wcx'],
});
