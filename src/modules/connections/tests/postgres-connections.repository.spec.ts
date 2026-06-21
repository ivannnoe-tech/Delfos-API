import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresConnectionsRepository } from '../repositories/postgres-connections.repository';
import {
  ConnectionAuthType,
  ConnectionStatus,
  ConnectionType,
} from '../schemas/connection.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `connections.tenant_id` is an FK to `tenants(id)`, so every connection needs a
 * real tenant row first. This helper inserts a tenant directly and returns its
 * UUID.
 */
async function seedTenant(testDb: IsolatedTestDb, slug: string): Promise<string> {
  const row = await testDb.db
    .insertInto('tenants')
    .values({ name: `Tenant ${slug}`, slug, settings: JSON.stringify({}) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

pgDescribe('PostgresConnectionsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresConnectionsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresConnectionsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a connection with a UUID id, tenant scope, JSONB round-trip and defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Primary customer API',
      baseUrl: 'https://api.customer.example',
      allowedHeaders: ['x-client-id', 'x-tenant'],
      metadata: { environment: 'sandbox', region: 'us-east', retries: 3, enabled: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.name).toBe('Primary customer API');
    expect(created.baseUrl).toBe('https://api.customer.example');
    // Unset optionals fall back to the column defaults.
    expect(created.type).toBe(ConnectionType.CustomerApi);
    expect(created.authType).toBe(ConnectionAuthType.None);
    expect(created.status).toBe(ConnectionStatus.Draft);
    expect(created.credentialRef).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.allowedHeaders).toEqual(['x-client-id', 'x-tenant']);
    expect(created.metadata).toEqual({
      environment: 'sandbox',
      region: 'us-east',
      retries: 3,
      enabled: true,
    });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit type, authType, credentialRef and status', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Explicit fields API',
      baseUrl: 'https://api.explicit.example',
      type: ConnectionType.CustomerApi,
      authType: ConnectionAuthType.BearerToken,
      credentialRef: 'vault-reference',
      allowedHeaders: [],
      metadata: {},
      status: ConnectionStatus.Active,
    });

    expect(created.authType).toBe(ConnectionAuthType.BearerToken);
    expect(created.credentialRef).toBe('vault-reference');
    expect(created.status).toBe(ConnectionStatus.Active);
  });

  it('rejects a duplicate (tenant_id, name) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      name: 'Dup Connection',
      baseUrl: 'https://api.dup.example',
      allowedHeaders: [],
      metadata: {},
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        name: 'Dup Connection',
        baseUrl: 'https://api.dup2.example',
        allowedHeaders: [],
        metadata: {},
      }),
    ).rejects.toThrow();
  });

  it('allows the same name under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      name: 'Shared Name',
      baseUrl: 'https://api.shared-a.example',
      allowedHeaders: [],
      metadata: {},
    });

    const underB = await repository.create({
      tenantId: tenantB,
      name: 'Shared Name',
      baseUrl: 'https://api.shared-b.example',
      allowedHeaders: [],
      metadata: {},
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      name: 'List First',
      baseUrl: 'https://api.list-first.example',
      allowedHeaders: [],
      metadata: {},
    });
    const second = await repository.create({
      tenantId: tenant,
      name: 'List Second',
      baseUrl: 'https://api.list-second.example',
      allowedHeaders: [],
      metadata: {},
    });
    // A connection under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      name: 'Other Tenant',
      baseUrl: 'https://api.list-other.example',
      allowedHeaders: [],
      metadata: {},
    });

    const page = await repository.findByTenant(tenant, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((c) => c.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((c) => c.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByTenant(tenant)).toBe(2);
  });

  it('finds a connection by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Find Me',
      baseUrl: 'https://api.find-me.example',
      allowedHeaders: ['x-find'],
      metadata: { k: 'v' },
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.allowedHeaders).toEqual(['x-find']);
    expect(found?.metadata).toEqual({ k: 'v' });

    // Same id, but under another tenant, is invisible (tenant isolation).
    expect(await repository.findByTenantAndId(tenantB, created.id)).toBeNull();
    // Unknown UUID and non-UUID ids return null.
    expect(
      await repository.findByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000'),
    ).toBeNull();
    expect(await repository.findByTenantAndId(tenantA, 'not-a-uuid')).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0201')).toBeNull();
  });

  it('returns empty/zero and null for non-UUID tenant or connection ids', async () => {
    expect(await repository.findByTenant('not-a-uuid', 1, 10)).toEqual([]);
    expect(await repository.countByTenant('not-a-uuid')).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0201', {
        name: 'x',
      }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
  });

  it('updates only provided fields, round-trips JSONB, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Before',
      baseUrl: 'https://api.update-me.example',
      allowedHeaders: ['x-old'],
      metadata: { a: 1 },
      status: ConnectionStatus.Draft,
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: ConnectionStatus.Active,
      allowedHeaders: ['x-new'],
      metadata: { b: 2 },
    });
    expect(updated?.status).toBe(ConnectionStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.baseUrl).toBe('https://api.update-me.example');
    expect(updated?.allowedHeaders).toEqual(['x-new']);
    expect(updated?.metadata).toEqual({ b: 2 });
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        name: 'x',
      }),
    ).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Owned By A',
      baseUrl: 'https://api.isolation.example',
      allowedHeaders: [],
      metadata: {},
    });

    // tenant B must not be able to update tenant A's connection.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
