import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      '@jest/globals': fileURLToPath(new URL('./tests/jestGlobals.cjs', import.meta.url)),
    },
  },
test: {
    globals: true,
    setupFiles: [
      './tests/setup/vitestJestShim.ts',
      './tests/setup/clerk-mock.ts',
      './tests/jest.setup.ts',
    ],
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**'
    ],
    deps: {
      moduleDirectories: ['node_modules', '__mocks__']
    }
  },
  coverage: {
    reportsDirectory: './coverage'
  }
});
