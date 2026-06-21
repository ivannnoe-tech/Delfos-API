import { Kysely } from 'kysely';
import { Pool } from 'pg';

import { DB } from '../database.types';
import { createMigrator } from '../migrator';
import { createKysely } from '../postgres.provider';

/**
 * Shared ephemeral-database primitives for real-PostgreSQL tests (P3 parity
 * specs) and the PostgreSQL E2E path (P4).
 *
 * Each provisioned database is uniquely named and migrated to latest, so callers
 * run concurrently without races or cross-contamination. Dropping uses
 * `WITH (FORCE)` so lingering connections never block teardown.
 *
 * No production database, no real secrets: callers must point at a THROWAWAY
 * PostgreSQL server (the Docker container in local/CI), never an operational one.
 */
export interface EphemeralDb {
  db: Kysely<DB>;
  database: string;
  url: string;
  cleanup: () => Promise<void>;
}

/** Replace the database path of a base PostgreSQL URL. */
export function urlWithDatabase(base: string, database: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}

/** Generate a unique, lowercase, SQL-safe ephemeral database name. */
export function uniqueDatabaseName(prefix = 't'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Create a fresh ephemeral database on `baseUrl`'s server, migrate it to latest,
 * and return a Kysely instance bound to it plus a `cleanup()` that destroys the
 * connection and drops the database `WITH (FORCE)`.
 */
export async function provisionEphemeralDb(baseUrl: string, prefix = 't'): Promise<EphemeralDb> {
  const database = uniqueDatabaseName(prefix);

  const admin = new Pool({ connectionString: urlWithDatabase(baseUrl, 'postgres') });
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }

  const url = urlWithDatabase(baseUrl, database);
  const db = createKysely(url);
  if (!db) {
    throw new Error('Failed to build a Kysely instance for the ephemeral database.');
  }

  const { error } = await createMigrator(db).migrateToLatest();
  if (error) {
    await db.destroy();
    await dropDatabase(baseUrl, database);
    throw error instanceof Error ? error : new Error(`migration failed: ${JSON.stringify(error)}`);
  }

  return {
    db,
    database,
    url,
    cleanup: async (): Promise<void> => {
      await db.destroy();
      await dropDatabase(baseUrl, database);
    },
  };
}

/** Drop an ephemeral database, forcing any lingering connections to close. */
export async function dropDatabase(baseUrl: string, database: string): Promise<void> {
  const dropper = new Pool({ connectionString: urlWithDatabase(baseUrl, 'postgres') });
  try {
    await dropper.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  } finally {
    await dropper.end();
  }
}
