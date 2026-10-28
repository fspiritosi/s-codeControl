import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // Los specs de Playwright (tests/e2e) los corre `npm run e2e`, no vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
