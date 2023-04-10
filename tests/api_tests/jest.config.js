/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  globalTeardown: './scripts/global_teardown.ts',
  testTimeout: 20000,
  setupFiles: ["dotenv/config"],
  transform: {
   "^.+\\.(t|j)sx?$": ["@swc/jest"],
 },
};