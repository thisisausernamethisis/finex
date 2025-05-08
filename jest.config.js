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
    '^@/(.*)$': '<rootDir>/$1', // keep existing root alias
    '^lib/repositories$': '<rootDir>/lib/repositories', // NEW – real code path
    '^@/lib/repositories$': '<rootDir>/lib/repositories' // NEW – real code path
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  // Added explicit .js extension for ESM compatibility
  globalTeardown: '<rootDir>/tests/_setup/globalTeardown.js'
};
