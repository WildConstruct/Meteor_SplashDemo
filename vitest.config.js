import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/serialization/**/*.test.js'],
    exclude: ['tests/integration/**', 'tests/visual/**', 'node_modules/**'],
    globals: true,
  },
});
