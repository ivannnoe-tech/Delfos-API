import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

import { createMigrator } from '../migrator';

/**
 * P2 migration round-trip test (ADR-0035 / ADR-0036).
 *
 * Guarded by `TEST_POSTGRES_URL`: when unset (default CI / local `npm test`)
 * the suite is skipped so it never needs a real Postgres. When set it must
 * point at a THROWAWAY database — the test migrates to latest, asserts every
 * table exists, then migrates fully down and asserts they are gone.
 */
const TEST_POSTGRES_URL = process.env.TEST_POSTGRES_URL;

const EXPECTED_TABLES = [
  'tenants',
  'users',
  'connections',
  'credentials',
  'datasets',
  'field_mappings',
  'query_definitions',
  'dashboard_definitions',
  'report_definitions',
  'semantic_models',
  'execution_requests',
  'execution_request_events',
  'audit_logs',
] as const;

const describeIfPostgres = TEST_POSTGRES_URL ? describe : describe.skip;

async function listPublicTables(db: Kysely<unknown>): Promise<string[]> {
  const result = await sql<{ table_name: string }>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> 'kysely_migration'
      AND table_name <> 'kysely_migration_lock'
    ORDER BY table_name
  `.execute(db);

  return result.rows.map((row) => row.table_name);
}

describeIfPostgres('postgres migrations round-trip', () => {
  let db: Kysely<unknown>;

  beforeAll(() => {
    db = new Kysely<unknown>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: TEST_POSTGRES_URL, max: 5 }),
      }),
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('migrates all 13 tables up, then fully reverses to an empty schema', async () => {
    const migrator = createMigrator(db);

    const up = await migrator.migrateToLatest();
    expect(up.error).toBeUndefined();
    expect(up.results?.every((result) => result.status === 'Success')).toBe(true);

    const afterUp = await listPublicTables(db);
    for (const table of EXPECTED_TABLES) {
      expect(afterUp).toContain(table);
    }
    expect(afterUp).toHaveLength(EXPECTED_TABLES.length);

    let result = await migrator.migrateDown();
    while ((result.results?.length ?? 0) > 0) {
      expect(result.error).toBeUndefined();
      result = await migrator.migrateDown();
    }

    const afterDown = await listPublicTables(db);
    expect(afterDown).toHaveLength(0);
  });
});
