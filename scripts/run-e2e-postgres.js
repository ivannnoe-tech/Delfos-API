'use strict';

/**
 * Cross-platform runner for the PostgreSQL E2E suite (ADR-0035 / ADR-0036, P4).
 *
 * Sets `E2E_POSTGRES_URL` (so the E2E harness provisions an ephemeral PostgreSQL
 * database and the repository factories pick the Postgres repos), then runs the
 * E2E jest config in-band. Avoids a `cross-env` dependency: env is set here, in
 * Node, so it works identically on Windows and POSIX shells.
 *
 * Respects an already-exported `E2E_POSTGRES_URL`; otherwise falls back to the
 * local Docker PostgreSQL used in development. The URL must point at a THROWAWAY
 * server — the harness creates and drops ephemeral databases on it.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const DEFAULT_POSTGRES_URL = 'postgresql://postgres:postgres@localhost:55432/postgres';

const env = { ...process.env };
if (!env.E2E_POSTGRES_URL || env.E2E_POSTGRES_URL.trim().length === 0) {
  env.E2E_POSTGRES_URL = DEFAULT_POSTGRES_URL;
}

const jestBin = path.join('node_modules', 'jest', 'bin', 'jest.js');
const result = spawnSync(
  process.execPath,
  [jestBin, '--config', 'jest.e2e.config.js', '--runInBand'],
  { stdio: 'inherit', env },
);

if (result.error) {
  console.error(`Failed to start the PostgreSQL E2E suite: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
