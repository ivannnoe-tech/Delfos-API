import { Kysely } from 'kysely';
import { Pool } from 'pg';

import { DB } from '../database.types';
import { createMigrator } from '../migrator';
import { createKysely } from '../postgres.provider';

/**
 * Real-PostgreSQL test harness for repository parity specs (P3).
 *
 * Set `TEST_POSTGRES_URL` to a reachable PostgreSQL to enable these specs; they
 * `describe.skip` otherwise, so `npm test` (and CI without Postgres) stays green.
 * Each call provisions a fresh, uniquely-named **database** and migrates it to
 * latest, so parity specs run concurrently without races or cross-contamination.
 * `cleanup()` drops the database and closes the pool.
 */
export const TEST_POSTGRES_URL = process.env.TEST_POSTGRES_URL;

export const pgDescribe = TEST_POSTGRES_URL ? describe : describe.skip;

export interface IsolatedTestDb {
  db: Kysely<DB>;
  database: string;
  cleanup: () => Promise<void>;
}

function urlWithDatabase(base: string, database: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}

export async function createIsolatedTestDb(): Promise<IsolatedTestDb> {
  if (!TEST_POSTGRES_URL) {
    throw new Error('TEST_POSTGRES_URL is not set; guard specs with pgDescribe.');
  }

  const database = `t_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;

  const admin = new Pool({ connectionString: urlWithDatabase(TEST_POSTGRES_URL, 'postgres') });
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }

  const db = createKysely(urlWithDatabase(TEST_POSTGRES_URL, database));
  if (!db) {
    throw new Error('Failed to build a Kysely instance for the isolated test database.');
  }

  const { error } = await createMigrator(db).migrateToLatest();
  if (error) {
    throw error instanceof Error ? error : new Error(`migration failed: ${JSON.stringify(error)}`);
  }

  return {
    db,
    database,
    cleanup: async (): Promise<void> => {
      await db.destroy();
      const dropper = new Pool({
        connectionString: urlWithDatabase(TEST_POSTGRES_URL, 'postgres'),
      });
      try {
        await dropper.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      } finally {
        await dropper.end();
      }
    },
  };
}
