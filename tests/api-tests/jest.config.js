/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  globalTeardown: './src/utils/config/global_teardown.ts',
  moduleNameMapper: {
    '^@sdk-js/(.*)$': '<rootDir>/../../packages/sdk-js/src/$1',
    '^@seeds/(.*)$': '<rootDir>/../../scripts/seeds/$1',
    '^@admin/(.*)$': '<rootDir>/../../admin/src/$1',
  },
};