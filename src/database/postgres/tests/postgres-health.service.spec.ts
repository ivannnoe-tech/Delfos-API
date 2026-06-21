import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';

import { DB } from '../database.types';
import { PostgresHealthService } from '../postgres-health.service';

/**
 * Build a Kysely instance whose driver never touches a real database. The
 * default {@link DummyDriver} resolves queries with an empty result, which lets
 * us exercise the `up` path deterministically. A failing driver factory lets us
 * exercise the `down` path without a network round-trip.
 */
function kyselyWithDriver(createDriver: () => DummyDriver): Kysely<DB> {
  return new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver,
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

class FailingDriver extends DummyDriver {
  constructor(private readonly failure: unknown) {
    super();
  }

  override async acquireConnection(): Promise<never> {
    throw this.failure;
  }
}

describe('PostgresHealthService', () => {
  it('reports disabled when no database is configured', async () => {
    const service = new PostgresHealthService(null);

    await expect(service.check()).resolves.toEqual({ status: 'disabled' });
  });

  it('reports up with a latency when the probe succeeds', async () => {
    const db = kyselyWithDriver(() => new DummyDriver());
    const service = new PostgresHealthService(db);

    const result = await service.check();

    expect(result.status).toBe('up');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();

    await db.destroy();
  });

  it('reports down with the error message when the probe fails', async () => {
    const db = kyselyWithDriver(() => new FailingDriver(new Error('connection refused')));
    const service = new PostgresHealthService(db);

    await expect(service.check()).resolves.toEqual({
      status: 'down',
      error: 'connection refused',
    });

    await db.destroy();
  });

  it('reports a generic message when the failure is not an Error', async () => {
    const db = kyselyWithDriver(() => new FailingDriver('boom'));
    const service = new PostgresHealthService(db);

    await expect(service.check()).resolves.toEqual({
      status: 'down',
      error: 'unknown error',
    });

    await db.destroy();
  });
});
