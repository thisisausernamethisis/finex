// Converted to ESM syntax
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    // Use simple, explicit mapping without regex for problematic modules
    '@/lib/rateLimit': '<rootDir>/tests/__mocks__/lib/rateLimit.ts',
    'lib/rateLimit': '<rootDir>/tests/__mocks__/lib/rateLimit.ts',
    // Other mappings
    '@/lib/repositories': '<rootDir>/lib/repositories',
    'lib/repositories': '<rootDir>/lib/repositories',
    // Generic path aliasing with simpler regex pattern
    '@/(.*)': '<rootDir>/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  // Added explicit .js extension for ESM compatibility
  globalTeardown: '<rootDir>/tests/_setup/globalTeardown.js'
};
