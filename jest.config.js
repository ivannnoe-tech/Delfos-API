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
  // Progressive coverage floor. Set below the current measured coverage
  // (statements ~87%, branches ~72%, functions ~76%, lines ~87%) with margin,
  // so the threshold guards against regressions without failing on a metric
  // that is artificially high. Tighten in later, deliberate steps.
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 65,
      functions: 70,
      lines: 80,
    },
  },
  testEnvironment: 'node',
};
