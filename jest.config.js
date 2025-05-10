/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
