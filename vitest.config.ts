import { defineConfig, configDefaults } from 'vitest/config'; // ⬇️ make sure vitest ≥ 0.34 is installed
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
    globals: true,                        // Enable globals mode for describe/it
    setupFiles: ['./vitest.setup.ts', './tests/setup/alias-shim.cjs'],
    exclude: [
      ...configDefaults.exclude,  // Keep default exclusions (node_modules, dist, etc.)
      'tests/e2e/**'              // Add our custom exclusion
    ]
  }
});
