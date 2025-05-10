import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname),
      'lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories'),
      '@/lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories'),
      '@jest/globals': resolve(__dirname, 'tests/vitestJestShim.ts')
    }
  },
  test: {
    setupFiles: ['./vitest.setup.ts']
  }
});
