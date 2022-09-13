/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  globalTeardown: './scripts/global_teardown.ts',
  testTimeout: 20000,
  transform: {
   "^.+\\.(t|j)sx?$": ["@swc/jest"],
 },
  moduleNameMapper: {
    '^@sdk-js/(.*)$': '<rootDir>/../../packages/web/sdk/src/$1',
    '^@seeds/(.*)$': '<rootDir>/../../scripts/seeds/$1',
    '^@admin/(.*)$': '<rootDir>/../../admin/src/$1',
  },
};