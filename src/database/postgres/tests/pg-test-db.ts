import { Kysely } from 'kysely';

import { DB } from '../database.types';
import { provisionEphemeralDb } from './ephemeral-db';

/**
 * Real-PostgreSQL test harness for repository parity specs (P3).
 *
 * Set `TEST_POSTGRES_URL` to a reachable PostgreSQL to enable these specs; they
 * `describe.skip` otherwise, so `npm test` (and CI without Postgres) stays green.
 * Each call provisions a fresh, uniquely-named **database** and migrates it to
 * latest, so parity specs run concurrently without races or cross-contamination.
 * `cleanup()` drops the database and closes the pool.
 *
 * Provisioning is delegated to the shared {@link provisionEphemeralDb} helper,
 * reused by the PostgreSQL E2E path (P4).
 */
export const TEST_POSTGRES_URL = process.env.TEST_POSTGRES_URL;

export const pgDescribe = TEST_POSTGRES_URL ? describe : describe.skip;

export interface IsolatedTestDb {
  db: Kysely<DB>;
  database: string;
  cleanup: () => Promise<void>;
}

export async function createIsolatedTestDb(): Promise<IsolatedTestDb> {
  if (!TEST_POSTGRES_URL) {
    throw new Error('TEST_POSTGRES_URL is not set; guard specs with pgDescribe.');
  }

  const { db, database, cleanup } = await provisionEphemeralDb(TEST_POSTGRES_URL);
  return { db, database, cleanup };
}
