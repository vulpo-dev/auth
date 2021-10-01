/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  moduleNameMapper: {
    '^@sdk-js/(.*)$': '<rootDir>/../../packages/web/sdk/src/$1',
    '^@seeds/(.*)$': '<rootDir>/../../seeds/$1',
  },
};