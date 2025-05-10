import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname),
      'lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories'),
      '@/lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories'),
      '@jest/globals': fileURLToPath(new URL('./tests/jestGlobals.cjs', import.meta.url))
    }
  },
  test: {
    setupFiles: ['./vitest.setup.ts']
  }
});
