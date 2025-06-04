import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname),
      'lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories'),
      '@/lib/repositories': resolve(__dirname, 'tests/__mocks__/lib/repositories')
    }
  },
  test: {
    // Exclude Jest contract tests and e2e tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/contract/**',
      '**/tests/e2e/**'
    ],
    // Only run unit tests in tests/unit directory
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    environment: 'node'
  }
});
