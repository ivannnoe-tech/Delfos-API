import { Kysely } from 'kysely';

import { DB } from '../database.types';
import { PostgresModule } from '../postgres.module';

describe('PostgresModule', () => {
  it('destroys the Kysely instance on shutdown when one exists', async () => {
    const destroy = jest.fn(async () => undefined);
    const fakeDb = { destroy } as unknown as Kysely<DB>;
    const module = new PostgresModule(fakeDb);

    await module.onModuleDestroy();

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on shutdown when Postgres is not configured', async () => {
    const module = new PostgresModule(null);

    await expect(module.onModuleDestroy()).resolves.toBeUndefined();
  });
});
