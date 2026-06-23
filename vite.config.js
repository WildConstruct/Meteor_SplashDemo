import { defineConfig } from 'vite';

// The browser client is the only application shell. WGSL files are imported as
// raw source strings (see src/client/ShaderSourceManifest.js) and handed to the
// host-neutral engine — they are never dynamically generated.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  assetsInclude: ['**/*.wgsl', '**/*.wcx'],
});
