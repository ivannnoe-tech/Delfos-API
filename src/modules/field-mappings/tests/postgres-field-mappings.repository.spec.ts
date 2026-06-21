import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresFieldMappingsRepository } from '../repositories/postgres-field-mappings.repository';
import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `field_mappings.tenant_id` is an FK to `tenants(id)`, so every mapping needs a
 * real tenant row first. This helper inserts a tenant directly and returns its UUID.
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
 * `field_mappings.connection_id` is an FK to `connections(id)`, so an explicit
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

pgDescribe('PostgresFieldMappingsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresFieldMappingsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresFieldMappingsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a field mapping with a UUID id, tenant scope and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'sales',
      sourcePath: 'order.total',
      targetField: 'totalAmount',
      targetType: FieldMappingTargetType.Money,
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.datasetKey).toBe('sales');
    expect(created.sourcePath).toBe('order.total');
    expect(created.targetField).toBe('totalAmount');
    expect(created.targetType).toBe(FieldMappingTargetType.Money);
    // Unset optionals fall back to the column defaults.
    expect(created.required).toBe(false);
    expect(created.status).toBe(FieldMappingStatus.Active);
    expect(created.connectionId).toBeUndefined();
    expect(created.transform).toBeUndefined();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit connection, required, transform and status values', async () => {
    const connectionId = await seedConnection(testDb, tenantA, 'Explicit connection');
    const created = await repository.create({
      tenantId: tenantA,
      connectionId,
      datasetKey: 'orders',
      sourcePath: 'order.created_at',
      targetField: 'createdAt',
      targetType: FieldMappingTargetType.Datetime,
      required: true,
      transform: FieldMappingTransform.StringToDate,
      status: FieldMappingStatus.Inactive,
    });

    expect(created.connectionId).toBe(connectionId);
    expect(created.required).toBe(true);
    expect(created.transform).toBe(FieldMappingTransform.StringToDate);
    expect(created.status).toBe(FieldMappingStatus.Inactive);
  });

  it('rejects a duplicate (tenant_id, dataset_key, target_field) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetKey: 'dup_dataset',
      sourcePath: 'a.b',
      targetField: 'dupField',
      targetType: FieldMappingTargetType.String,
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        datasetKey: 'dup_dataset',
        sourcePath: 'c.d',
        targetField: 'dupField',
        targetType: FieldMappingTargetType.String,
      }),
    ).rejects.toThrow();
  });

  it('allows the same (dataset_key, target_field) under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetKey: 'shared_key',
      sourcePath: 'x.y',
      targetField: 'sharedField',
      targetType: FieldMappingTargetType.String,
    });

    const underB = await repository.create({
      tenantId: tenantB,
      datasetKey: 'shared_key',
      sourcePath: 'x.y',
      targetField: 'sharedField',
      targetType: FieldMappingTargetType.String,
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const connectionId = await seedConnection(testDb, tenant, 'List connection');
    const first = await repository.create({
      tenantId: tenant,
      connectionId,
      datasetKey: 'list_ds',
      sourcePath: 'a.first',
      targetField: 'listFirst',
      targetType: FieldMappingTargetType.String,
    });
    const second = await repository.create({
      tenantId: tenant,
      datasetKey: 'other_ds',
      sourcePath: 'a.second',
      targetField: 'listSecond',
      targetType: FieldMappingTargetType.String,
    });
    // A mapping under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      datasetKey: 'list_ds',
      sourcePath: 'a.other',
      targetField: 'otherTenant',
      targetType: FieldMappingTargetType.String,
    });

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((m) => m.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((m) => m.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);

    // Filters narrow within the tenant scope.
    const byDatasetKey = await repository.findByFilters(
      { tenantId: tenant, datasetKey: 'list_ds' },
      1,
      10,
    );
    expect(byDatasetKey).toHaveLength(1);
    expect(byDatasetKey[0]?.id).toBe(first.id);

    const byConnection = await repository.findByFilters({ tenantId: tenant, connectionId }, 1, 10);
    expect(byConnection).toHaveLength(1);
    expect(byConnection[0]?.id).toBe(first.id);
    expect(await repository.countByFilters({ tenantId: tenant, datasetKey: 'other_ds' })).toBe(1);
  });

  it('returns empty/zero and null for a non-UUID tenant or mapping id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0601', {
        status: FieldMappingStatus.Inactive,
      }),
    ).toBeNull();
    expect(
      await repository.updateByTenantAndId(tenantA, 'not-a-uuid', {
        status: FieldMappingStatus.Inactive,
      }),
    ).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(
      await repository.updateByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0601', {
        status: FieldMappingStatus.Inactive,
      }),
    ).toBeNull();
  });

  it('updates only provided fields, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'update_me',
      sourcePath: 'order.total',
      targetField: 'updateField',
      targetType: FieldMappingTargetType.Money,
      status: FieldMappingStatus.Active,
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      targetType: FieldMappingTargetType.Number,
      transform: FieldMappingTransform.StringToNumber,
      required: true,
    });
    expect(updated?.targetType).toBe(FieldMappingTargetType.Number);
    expect(updated?.transform).toBe(FieldMappingTransform.StringToNumber);
    expect(updated?.required).toBe(true);
    expect(updated?.sourcePath).toBe('order.total'); // unchanged
    expect(updated?.targetField).toBe('updateField'); // unchanged
    expect(updated?.status).toBe(FieldMappingStatus.Active); // unchanged
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        required: true,
      }),
    ).toBeNull();
  });

  it('deactivates a field mapping via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'deactivate_me',
      sourcePath: 'order.status',
      targetField: 'deactivateField',
      targetType: FieldMappingTargetType.String,
      status: FieldMappingStatus.Active,
    });

    const deactivated = await repository.deactivateByTenantAndId(tenantA, created.id);
    expect(deactivated?.status).toBe(FieldMappingStatus.Inactive);

    // Cross-tenant deactivate is a no-op.
    expect(await repository.deactivateByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetKey: 'owned_by_a',
      sourcePath: 'order.id',
      targetField: 'ownedField',
      targetType: FieldMappingTargetType.String,
    });

    // tenant B must not be able to update tenant A's mapping.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, {
      targetField: 'Hijacked',
    });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByFilters(
      { tenantId: tenantA, datasetKey: 'owned_by_a' },
      1,
      10,
    );
    expect(reread[0]?.targetField).toBe('ownedField');
    expect(reread[0]?.tenantId).toBe(tenantA);
  });
});
