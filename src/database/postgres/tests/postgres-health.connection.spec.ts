import { Kysely } from 'kysely';

import { DB } from '../database.types';
import { PostgresHealthService } from '../postgres-health.service';
import { createKysely } from '../postgres.provider';

/**
 * Real-connection probe against a live PostgreSQL. Skipped unless
 * `TEST_POSTGRES_URL` is set, so the default `npm test` (and CI without a
 * Postgres service) stays green. Run locally with the docker-compose `postgres`
 * service up:
 *   TEST_POSTGRES_URL=postgresql://delfos:delfos@localhost:5432/delfos npm test
 */
const url = process.env.TEST_POSTGRES_URL;
const maybe = url ? describe : describe.skip;

maybe('PostgresHealthService (real connection)', () => {
  let db: Kysely<DB> | null = null;

  afterAll(async () => {
    await db?.destroy();
  });

  it('connects to a real PostgreSQL and reports up', async () => {
    db = createKysely(url);
    const service = new PostgresHealthService(db);

    const result = await service.check();

    expect(result.status).toBe('up');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
