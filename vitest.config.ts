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
      './tests/vitestJestShim.ts',  // load shim first
      './tests/setup/clerk-mock.ts',
      './tests/helpers/mockBullmq.ts',   // unified BullMQ mock
      './tests/helpers/auth.ts',        // make __TEST_USER__ global before jest.setup
      './tests/jest.setup.ts',
    ],
    globalSetup: './tests/setup/globalSetup.ts', // run DB prep after shim
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**'
    ],
    deps: {
      moduleDirectories: ['node_modules', '__mocks__']
    },
    coverage: {
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 70,
        statements: 80
      }
    }
  }
});
