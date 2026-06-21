import { NoopCacheService } from '../noop-cache.service';

describe('NoopCacheService', () => {
  it('is disabled, always misses, and no-ops writes', async () => {
    const cache = new NoopCacheService();

    expect(cache.enabled).toBe(false);
    expect(await cache.get('k')).toBeNull();
    await expect(cache.set('k', { a: 1 }, 300)).resolves.toBeUndefined();
    await expect(cache.del('k')).resolves.toBeUndefined();
    expect(await cache.delByPrefix('p')).toBe(0);
    expect(cache.stats()).toEqual({ hits: 0, misses: 1, errors: 0 });
  });

  it('still rejects a non-positive TTL (no permanent keys)', async () => {
    const cache = new NoopCacheService();

    await expect(cache.set('k', 'v', 0)).rejects.toThrow('positive TTL');
    await expect(cache.set('k', 'v', -5)).rejects.toThrow('positive TTL');
  });
});
