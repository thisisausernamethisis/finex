/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    'lib/(.*)$': '<rootDir>/lib/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1'
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/clerk-mock.ts',
    '<rootDir>/tests/jest.setup.ts'
  ]
};
