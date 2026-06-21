import { Kysely } from 'kysely';

import { createKysely } from '../postgres.provider';

describe('createKysely', () => {
  it('returns null when no URL is configured', () => {
    expect(createKysely(undefined)).toBeNull();
    expect(createKysely('')).toBeNull();
  });

  it('returns a Kysely instance when a URL is provided (without connecting)', async () => {
    const db = createKysely('postgresql://delfos:delfos@localhost:5432/delfos');

    expect(db).toBeInstanceOf(Kysely);

    // The pg Pool is lazy: constructing it does not open a socket. Closing it
    // here proves no real connection was required to build the instance.
    await db?.destroy();
  });
});
