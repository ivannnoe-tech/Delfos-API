/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    // PostgreSQL migrations + migrator are DDL exercised by the real-Postgres
    // integration spec (src/database/postgres/tests/migrations.spec.ts), guarded
    // by TEST_POSTGRES_URL and run in CI once Postgres is wired (P4). They are
    // verified there, not by unit tests, so they sit outside the unit coverage
    // floor. (ADR-0035 / ADR-0036, migration phase P2.)
    '!src/database/postgres/migrations/**',
    '!src/database/postgres/migrator.ts',
    // Repository implementations are data-access integration-tested, not unit
    // tested: Mongo repos via the e2e suite (mongodb-memory-server), PostgreSQL
    // repos via guarded real-Postgres parity specs (TEST_POSTGRES_URL). The
    // abstract `*.repository.ts` contracts hold the unit-relevant types.
    // (ADR-0035 / ADR-0036, migration phase P3.)
    '!src/modules/**/repositories/mongo-*.repository.ts',
    '!src/modules/**/repositories/postgres-*.repository.ts',
    // Real-Postgres test harness helpers: exercised by the guarded parity specs
    // and the PostgreSQL E2E path, not by unit tests. (ADR-0035 / ADR-0036, P3/P4.)
    '!src/database/postgres/tests/**',
  ],
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
