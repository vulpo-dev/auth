/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalTeardown: './scripts/global_teardown.ts',
  testTimeout: 20000,
  moduleNameMapper: {
    '^@sdk-js/(.*)$': '<rootDir>/../../packages/web/sdk/src/$1',
    '^@seeds/(.*)$': '<rootDir>/../../scripts/seeds/$1',
    '^@admin/(.*)$': '<rootDir>/../../admin/src/$1',
  },
};