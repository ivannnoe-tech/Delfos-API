import Valkey from 'iovalkey';

import { buildCacheKey, buildCacheTenantPrefix } from '../cache-key';
import { ValkeyCacheService } from '../valkey-cache.service';

/**
 * Real-Valkey integration. Skipped unless `TEST_VALKEY_URL` is set, so the
 * default `npm test` (and CI without Valkey) stays green. Run locally with:
 *   TEST_VALKEY_URL=redis://localhost:6399 npm test
 */
const url = process.env.TEST_VALKEY_URL;
const maybe = url ? describe : describe.skip;

maybe('ValkeyCacheService (real Valkey)', () => {
  let client: Valkey;
  let cache: ValkeyCacheService;

  beforeAll(() => {
    client = new Valkey(url as string);
    cache = new ValkeyCacheService(client);
  });

  afterAll(async () => {
    await client.quit();
  });

  it('sets a value with a TTL and reads it back', async () => {
    const key = buildCacheKey({
      env: 'test',
      tenantId: 't-int',
      namespace: 'catalog',
      parts: ['roundtrip', Date.now()],
    });

    await cache.set(key, { hello: 'world', n: 7 }, 60);
    expect(await cache.get<{ hello: string; n: number }>(key)).toEqual({ hello: 'world', n: 7 });

    const ttl = await client.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);

    await cache.del(key);
    expect(await cache.get(key)).toBeNull();
  });

  it('deletes by tenant prefix via SCAN (tenant isolation)', async () => {
    const tenantA = `a-${Date.now()}`;
    const tenantB = `b-${Date.now()}`;
    await cache.set(
      buildCacheKey({ env: 'test', tenantId: tenantA, namespace: 'catalog', parts: ['x'] }),
      1,
      60,
    );
    await cache.set(
      buildCacheKey({ env: 'test', tenantId: tenantA, namespace: 'catalog', parts: ['y'] }),
      2,
      60,
    );
    await cache.set(
      buildCacheKey({ env: 'test', tenantId: tenantB, namespace: 'catalog', parts: ['x'] }),
      3,
      60,
    );

    const removed = await cache.delByPrefix(buildCacheTenantPrefix('test', tenantA));
    expect(removed).toBe(2);

    const survivor = buildCacheKey({
      env: 'test',
      tenantId: tenantB,
      namespace: 'catalog',
      parts: ['x'],
    });
    expect(await cache.get<number>(survivor)).toBe(3);
    await cache.del(survivor);
  });
});
