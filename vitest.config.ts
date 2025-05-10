import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname),
      '^lib/(.*)$': resolve(__dirname, 'lib/$1'),
      'lib/(.*)$': resolve(__dirname, 'lib/$1'),
      '@jest/globals': fileURLToPath(new URL('./tests/jestGlobals.cjs', import.meta.url)),
      './themeTemplateRepository': resolve(__dirname, 'lib/repositories/themeTemplateRepository.ts')
    }
  },
  test: {
    globals: true,
    setupFiles: [
      './vitest.setup.ts',
      './tests/setup/alias-shim.cjs',
      './tests/setup/mock-aliases.ts',
      './tests/setup/reset-rate-limit.ts',
      './tests/setup/verbose.ts'
    ],
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**'
    ],
    deps: {
      moduleDirectories: ['node_modules', '__mocks__']
    }
  }
});
