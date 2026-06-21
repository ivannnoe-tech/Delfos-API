import { ValkeyCacheService, ValkeyClient } from '../valkey-cache.service';

class FakeValkey implements ValkeyClient {
  readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, _mode: 'EX', _ttl: number): Promise<unknown> {
    this.store.set(key, value);
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) removed += 1;
    }
    return removed;
  }

  async scan(
    _cursor: string,
    _matchToken: 'MATCH',
    pattern: string,
    _countToken: 'COUNT',
    _count: number,
  ): Promise<[string, string[]]> {
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    const keys = [...this.store.keys()].filter((key) => key.startsWith(prefix));
    return ['0', keys];
  }

  async quit(): Promise<unknown> {
    return 'OK';
  }
}

class ThrowingValkey implements ValkeyClient {
  async get(): Promise<string | null> {
    throw new Error('down');
  }
  async set(): Promise<unknown> {
    throw new Error('down');
  }
  async del(): Promise<number> {
    throw new Error('down');
  }
  async scan(): Promise<[string, string[]]> {
    throw new Error('down');
  }
  async quit(): Promise<unknown> {
    return 'OK';
  }
}

describe('ValkeyCacheService', () => {
  it('round-trips a JSON value and tracks hit/miss', async () => {
    const cache = new ValkeyCacheService(new FakeValkey());

    expect(await cache.get('missing')).toBeNull();
    await cache.set('k', { a: 1, b: 'x' }, 300);
    expect(await cache.get<{ a: number; b: string }>('k')).toEqual({ a: 1, b: 'x' });
    expect(cache.stats()).toEqual({ hits: 1, misses: 1, errors: 0 });
    expect(cache.enabled).toBe(true);
  });

  it('rejects a non-positive TTL (no permanent keys)', async () => {
    const cache = new ValkeyCacheService(new FakeValkey());
    await expect(cache.set('k', 'v', 0)).rejects.toThrow('positive TTL');
  });

  it('deletes by restricted prefix via SCAN', async () => {
    const fake = new FakeValkey();
    const cache = new ValkeyCacheService(fake);
    await cache.set('delfos:local:tenant:t1:catalog:a', 1, 60);
    await cache.set('delfos:local:tenant:t1:catalog:b', 2, 60);
    await cache.set('delfos:local:tenant:t2:catalog:a', 3, 60);

    const removed = await cache.delByPrefix('delfos:local:tenant:t1:');

    expect(removed).toBe(2);
    expect(fake.store.has('delfos:local:tenant:t2:catalog:a')).toBe(true);
  });

  it('falls back gracefully when the backend errors (never throws)', async () => {
    const cache = new ValkeyCacheService(new ThrowingValkey());

    expect(await cache.get('k')).toBeNull();
    await expect(cache.set('k', 'v', 300)).resolves.toBeUndefined();
    await expect(cache.del('k')).resolves.toBeUndefined();
    expect(await cache.delByPrefix('p')).toBe(0);
    expect(cache.stats().errors).toBeGreaterThanOrEqual(4);
  });
});
