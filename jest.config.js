/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: 'coverage',
  // Progressive coverage floor. Set just below the current measured coverage
  // (statements ~87%, branches ~72%, functions ~76%, lines ~87%) with a small
  // margin, so the threshold guards against regressions. Matured one step
  // from the initial 80/65/70/80 floor; tighten further in deliberate steps.
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 70,
      functions: 74,
      lines: 85,
    },
  },
  testEnvironment: 'node',
};
