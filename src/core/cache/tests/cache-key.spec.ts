import { buildCacheKey, buildCacheTenantPrefix } from '../cache-key';

describe('buildCacheKey', () => {
  it('builds an env- and tenant-namespaced key', () => {
    const key = buildCacheKey({
      env: 'local',
      tenantId: '662d4f6e7a1c2b00124f0001',
      namespace: 'catalog',
      parts: ['datasets', 'sales'],
    });

    expect(key).toBe('delfos:local:tenant:662d4f6e7a1c2b00124f0001:catalog:datasets:sales');
  });

  it('requires a tenantId (no cross-tenant keys)', () => {
    expect(() =>
      buildCacheKey({ env: 'local', tenantId: '', namespace: 'catalog', parts: ['x'] }),
    ).toThrow('cache key requires a tenantId');
  });

  it('requires an env and at least one part', () => {
    expect(() =>
      buildCacheKey({ env: '', tenantId: 't1', namespace: 'catalog', parts: ['x'] }),
    ).toThrow('cache key requires an env label.');
    expect(() =>
      buildCacheKey({ env: 'local', tenantId: 't1', namespace: 'catalog', parts: [] }),
    ).toThrow('at least one identifying part');
  });

  it('sanitizes segments so keys stay unambiguous', () => {
    const key = buildCacheKey({
      env: 'local',
      tenantId: 't1',
      namespace: 'idempotency',
      parts: ['create:tenant', 'a b'],
    });

    expect(key).toBe('delfos:local:tenant:t1:idempotency:create_tenant:a_b');
  });

  it('builds a tenant-scoped prefix, optionally per namespace', () => {
    expect(buildCacheTenantPrefix('local', 't1')).toBe('delfos:local:tenant:t1:');
    expect(buildCacheTenantPrefix('local', 't1', 'catalog')).toBe(
      'delfos:local:tenant:t1:catalog:',
    );
    expect(() => buildCacheTenantPrefix('local', '')).toThrow('requires a tenantId');
  });
});
