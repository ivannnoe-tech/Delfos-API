import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresDatasetsRepository } from '../repositories/postgres-datasets.repository';
import {
  DatasetFieldSemanticRole,
  DatasetFieldType,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `datasets.tenant_id` is an FK to `tenants(id)`, so every dataset needs a real
 * tenant row first. This helper inserts a tenant directly and returns its UUID.
 */
async function seedTenant(testDb: IsolatedTestDb, slug: string): Promise<string> {
  const row = await testDb.db
    .insertInto('tenants')
    .values({ name: `Tenant ${slug}`, slug, settings: JSON.stringify({}) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

/**
 * `datasets.connection_id` is an FK to `connections(id)`, so an explicit
 * connection reference needs a real connection row under the same tenant first.
 */
async function seedConnection(
  testDb: IsolatedTestDb,
  tenantId: string,
  name: string,
): Promise<string> {
  const row = await testDb.db
    .insertInto('connections')
    .values({
      tenant_id: tenantId,
      name,
      base_url: 'https://api.example',
      allowed_headers: JSON.stringify([]),
      metadata: JSON.stringify({}),
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

pgDescribe('PostgresDatasetsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresDatasetsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresDatasetsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a dataset with a UUID id, tenant scope, JSONB round-trip and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'sales_orders',
      name: 'Pedidos de venda',
      fields: [
        {
          key: 'order_id',
          label: 'Codigo do pedido',
          type: DatasetFieldType.String,
          required: true,
          description: 'Identificador do pedido',
          semanticRole: DatasetFieldSemanticRole.Identifier,
        },
      ],
      primaryKeyFields: ['order_id'],
      tags: ['sales', 'orders'],
      metadata: { domain: 'sales', retries: 3, enabled: true },
      settings: { defaultPageSize: 50 },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.datasetKey).toBe('sales_orders');
    expect(created.name).toBe('Pedidos de venda');
    // Unset optionals fall back to the column defaults.
    expect(created.sourceType).toBe(DatasetSourceType.Api);
    expect(created.status).toBe(DatasetStatus.Draft);
    expect(created.refreshMode).toBe(DatasetRefreshMode.Manual);
    expect(created.schemaMode).toBe(DatasetSchemaMode.Declared);
    expect(created.connectionId).toBeUndefined();
    expect(created.description).toBeUndefined();
    expect(created.timeField).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.fields).toEqual([
      {
        key: 'order_id',
        label: 'Codigo do pedido',
        type: DatasetFieldType.String,
        required: true,
        description: 'Identificador do pedido',
        semanticRole: DatasetFieldSemanticRole.Identifier,
      },
    ]);
    expect(created.primaryKeyFields).toEqual(['order_id']);
    expect(created.tags).toEqual(['sales', 'orders']);
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.settings).toEqual({ defaultPageSize: 50 });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit enum, connection, time field and actor values', async () => {
    const connectionId = await seedConnection(testDb, tenantA, 'Explicit connection');
    const created = await repository.create({
      tenantId: tenantA,
      connectionId,
      datasetKey: 'explicit_dataset',
      name: 'Explicit dataset',
      description: 'Has explicit values',
      sourceType: DatasetSourceType.Database,
      status: DatasetStatus.Active,
      refreshMode: DatasetRefreshMode.Scheduled,
      schemaMode: DatasetSchemaMode.Inferred,
      fields: [],
      primaryKeyFields: [],
      timeField: 'created_at',
      tags: [],
      metadata: {},
      settings: {},
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.connectionId).toBe(connectionId);
    expect(created.description).toBe('Has explicit values');
    expect(created.sourceType).toBe(DatasetSourceType.Database);
    expect(created.status).toBe(DatasetStatus.Active);
    expect(created.refreshMode).toBe(DatasetRefreshMode.Scheduled);
    expect(created.schemaMode).toBe(DatasetSchemaMode.Inferred);
    expect(created.timeField).toBe('created_at');
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.updatedBy).toBe('dev-actor-001');
  });

  it('rejects a duplicate (tenant_id, dataset_key) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetKey: 'dup_dataset',
      name: 'Dup One',
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        datasetKey: 'dup_dataset',
        name: 'Dup Two',
        fields: [],
        primaryKeyFields: [],
        tags: [],
        metadata: {},
        settings: {},
      }),
    ).rejects.toThrow();
  });

  it('allows the same dataset_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetKey: 'shared_key',
      name: 'Shared A',
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const underB = await repository.create({
      tenantId: tenantB,
      datasetKey: 'shared_key',
      name: 'Shared B',
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      datasetKey: 'list_first',
      name: 'List First',
      sourceType: DatasetSourceType.Api,
      status: DatasetStatus.Active,
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });
    const second = await repository.create({
      tenantId: tenant,
      datasetKey: 'list_second',
      name: 'List Second',
      sourceType: DatasetSourceType.Manual,
      status: DatasetStatus.Active,
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });
    // A dataset under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      datasetKey: 'list_other',
      name: 'Other Tenant',
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((d) => d.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((d) => d.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);

    // Filters narrow within the tenant scope.
    const apiOnly = await repository.findByFilters(
      { tenantId: tenant, sourceType: DatasetSourceType.Api },
      1,
      10,
    );
    expect(apiOnly).toHaveLength(1);
    expect(apiOnly[0]?.id).toBe(first.id);
    expect(await repository.countByFilters({ tenantId: tenant, datasetKey: 'list_second' })).toBe(
      1,
    );
  });

  it('finds a dataset by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'find_me',
      name: 'Find Me',
      fields: [],
      primaryKeyFields: ['order_id'],
      tags: ['x'],
      metadata: { k: 'v' },
      settings: { s: 1 },
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.primaryKeyFields).toEqual(['order_id']);
    expect(found?.tags).toEqual(['x']);
    expect(found?.metadata).toEqual({ k: 'v' });
    expect(found?.settings).toEqual({ s: 1 });

    // Same id, but under another tenant, is invisible (tenant isolation).
    expect(await repository.findByTenantAndId(tenantB, created.id)).toBeNull();
    // Unknown UUID and non-UUID ids return null.
    expect(
      await repository.findByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000'),
    ).toBeNull();
    expect(await repository.findByTenantAndId(tenantA, 'not-a-uuid')).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0501')).toBeNull();
  });

  it('returns empty/zero and null for a non-UUID tenant or dataset id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0501', { name: 'x' }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
  });

  it('updates only provided fields, round-trips JSONB, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'update_me',
      name: 'Before',
      status: DatasetStatus.Draft,
      fields: [],
      primaryKeyFields: ['old_key'],
      tags: ['old'],
      metadata: { a: 1 },
      settings: { s: 0 },
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: DatasetStatus.Active,
      primaryKeyFields: ['new_key'],
      tags: ['new'],
      metadata: { b: 2 },
      updatedBy: 'dev-actor-002',
    });
    expect(updated?.status).toBe(DatasetStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.datasetKey).toBe('update_me');
    expect(updated?.primaryKeyFields).toEqual(['new_key']);
    expect(updated?.tags).toEqual(['new']);
    expect(updated?.metadata).toEqual({ b: 2 });
    expect(updated?.settings).toEqual({ s: 0 }); // unchanged
    expect(updated?.updatedBy).toBe('dev-actor-002');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        name: 'x',
      }),
    ).toBeNull();
  });

  it('archives a dataset via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'archive_me',
      name: 'Archive Me',
      status: DatasetStatus.Active,
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const archived = await repository.archiveByTenantAndId(tenantA, created.id, 'dev-actor-003');
    expect(archived?.status).toBe(DatasetStatus.Archived);
    expect(archived?.updatedBy).toBe('dev-actor-003');

    // Cross-tenant archive is a no-op.
    expect(await repository.archiveByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'owned_by_a',
      name: 'Owned By A',
      fields: [],
      primaryKeyFields: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    // tenant B must not be able to update tenant A's dataset.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
