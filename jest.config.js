/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1'
  }
};
