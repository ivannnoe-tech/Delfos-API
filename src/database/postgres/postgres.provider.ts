import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { DB } from './database.types';

/**
 * Build the shared Kysely instance from the configured PostgreSQL URL.
 *
 * Returns `null` when no URL is configured — during the phased migration
 * (ADR-0035) Postgres is optional and the API keeps running on MongoDB.
 */
export function createKysely(url: string | undefined): Kysely<DB> | null {
  if (!url) {
    return null;
  }

  const dialect = new PostgresDialect({
    pool: new Pool({ connectionString: url, max: 10 }),
  });

  return new Kysely<DB>({ dialect });
}
