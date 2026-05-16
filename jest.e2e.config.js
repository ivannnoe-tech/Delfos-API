/** @type {import('jest').Config} */
// E2E config: boots the real app against an in-memory MongoDB.
// Kept separate from the unit jest config; `npm test` never runs these.
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/e2e/.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  testTimeout: 60000,
  maxWorkers: 1,
};
