import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresQueryDefinitionsRepository } from '../repositories/postgres-query-definitions.repository';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionFilterOperator,
  QueryDefinitionSortDirection,
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `query_definitions.tenant_id` is an FK to `tenants(id)`, so every query
 * definition needs a real tenant row first. This helper inserts a tenant
 * directly and returns its UUID.
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
 * `query_definitions.dataset_id` is an FK to `datasets(id)` (ON DELETE RESTRICT),
 * so every query definition needs a real dataset row under the same tenant.
 */
async function seedDataset(
  testDb: IsolatedTestDb,
  tenantId: string,
  datasetKey: string,
): Promise<string> {
  const row = await testDb.db
    .insertInto('datasets')
    .values({
      tenant_id: tenantId,
      dataset_key: datasetKey,
      name: `Dataset ${datasetKey}`,
      fields: JSON.stringify([]),
      primary_key_fields: JSON.stringify([]),
      tags: JSON.stringify([]),
      metadata: JSON.stringify({}),
      settings: JSON.stringify({}),
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

pgDescribe('PostgresQueryDefinitionsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresQueryDefinitionsRepository;
  let tenantA: string;
  let tenantB: string;
  let datasetA: string;
  let datasetB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresQueryDefinitionsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
    datasetA = await seedDataset(testDb, tenantA, 'dataset_a');
    datasetB = await seedDataset(testDb, tenantB, 'dataset_b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a query definition with a UUID id, tenant scope, JSONB round-trip and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'sales_overview',
      name: 'Visao geral de vendas',
      metrics: [
        {
          key: 'total_sales',
          label: 'Vendas totais',
          field: 'total_amount',
          aggregation: QueryDefinitionAggregation.Sum,
          format: 'currency',
          description: 'Soma do valor total de vendas',
        },
      ],
      dimensions: [
        {
          key: 'seller',
          label: 'Vendedor',
          field: 'seller_name',
          type: QueryDefinitionDimensionType.String,
        },
      ],
      filters: [
        {
          key: 'period',
          label: 'Periodo',
          field: 'created_at',
          operator: QueryDefinitionFilterOperator.DateRange,
          required: true,
          allowedValues: ['day', true, null],
        },
      ],
      sorts: [{ field: 'total_amount', direction: QueryDefinitionSortDirection.Desc }],
      allowedGranularities: [
        QueryDefinitionTimeGranularity.Day,
        QueryDefinitionTimeGranularity.Week,
      ],
      tags: ['sales', 'overview'],
      metadata: { domain: 'sales', retries: 3, enabled: true },
      settings: { visibleInBuilder: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.datasetId).toBe(datasetA);
    expect(created.queryKey).toBe('sales_overview');
    expect(created.name).toBe('Visao geral de vendas');
    // Unset optionals fall back to the column defaults.
    expect(created.status).toBe(QueryDefinitionStatus.Draft);
    expect(created.type).toBe(QueryDefinitionType.Table);
    expect(created.description).toBeUndefined();
    expect(created.defaultLimit).toBeUndefined();
    expect(created.timeField).toBeUndefined();
    expect(created.createdBy).toBeUndefined();
    expect(created.updatedBy).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.metrics).toEqual([
      {
        key: 'total_sales',
        label: 'Vendas totais',
        field: 'total_amount',
        aggregation: QueryDefinitionAggregation.Sum,
        format: 'currency',
        description: 'Soma do valor total de vendas',
      },
    ]);
    expect(created.dimensions).toEqual([
      {
        key: 'seller',
        label: 'Vendedor',
        field: 'seller_name',
        type: QueryDefinitionDimensionType.String,
      },
    ]);
    expect(created.filters).toEqual([
      {
        key: 'period',
        label: 'Periodo',
        field: 'created_at',
        operator: QueryDefinitionFilterOperator.DateRange,
        required: true,
        allowedValues: ['day', true, null],
      },
    ]);
    expect(created.sorts).toEqual([
      { field: 'total_amount', direction: QueryDefinitionSortDirection.Desc },
    ]);
    expect(created.allowedGranularities).toEqual([
      QueryDefinitionTimeGranularity.Day,
      QueryDefinitionTimeGranularity.Week,
    ]);
    expect(created.tags).toEqual(['sales', 'overview']);
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.settings).toEqual({ visibleInBuilder: true });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit enum, description, default limit, time field and actor values', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'explicit_query',
      name: 'Explicit query',
      description: 'Has explicit values',
      status: QueryDefinitionStatus.Active,
      type: QueryDefinitionType.Timeseries,
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      defaultLimit: 250,
      timeField: 'created_at',
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.description).toBe('Has explicit values');
    expect(created.status).toBe(QueryDefinitionStatus.Active);
    expect(created.type).toBe(QueryDefinitionType.Timeseries);
    expect(created.defaultLimit).toBe(250);
    expect(created.timeField).toBe('created_at');
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.updatedBy).toBe('dev-actor-001');
  });

  it('rejects a duplicate (tenant_id, query_key) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'dup_query',
      name: 'Dup One',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        datasetId: datasetA,
        queryKey: 'dup_query',
        name: 'Dup Two',
        metrics: [],
        dimensions: [],
        filters: [],
        sorts: [],
        allowedGranularities: [],
        tags: [],
        metadata: {},
        settings: {},
      }),
    ).rejects.toThrow();
  });

  it('allows the same query_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'shared_key',
      name: 'Shared A',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const underB = await repository.create({
      tenantId: tenantB,
      datasetId: datasetB,
      queryKey: 'shared_key',
      name: 'Shared B',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const dataset = await seedDataset(testDb, tenant, 'list_dataset');
    const first = await repository.create({
      tenantId: tenant,
      datasetId: dataset,
      queryKey: 'list_first',
      name: 'List First',
      status: QueryDefinitionStatus.Active,
      type: QueryDefinitionType.Metric,
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });
    const second = await repository.create({
      tenantId: tenant,
      datasetId: dataset,
      queryKey: 'list_second',
      name: 'List Second',
      status: QueryDefinitionStatus.Active,
      type: QueryDefinitionType.Table,
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });
    // A query definition under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      datasetId: datasetB,
      queryKey: 'list_other',
      name: 'Other Tenant',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((q) => q.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((q) => q.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);

    // Filters narrow within the tenant scope.
    const metricOnly = await repository.findByFilters(
      { tenantId: tenant, type: QueryDefinitionType.Metric },
      1,
      10,
    );
    expect(metricOnly).toHaveLength(1);
    expect(metricOnly[0]?.id).toBe(first.id);
    expect(await repository.countByFilters({ tenantId: tenant, queryKey: 'list_second' })).toBe(1);
    expect(await repository.countByFilters({ tenantId: tenant, datasetId: dataset })).toBe(2);
  });

  it('finds a query definition by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'find_me',
      name: 'Find Me',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [QueryDefinitionTimeGranularity.Month],
      tags: ['x'],
      metadata: { k: 'v' },
      settings: { s: 1 },
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.allowedGranularities).toEqual([QueryDefinitionTimeGranularity.Month]);
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
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0601')).toBeNull();
  });

  it('returns empty/zero and null for a non-UUID tenant or query definition id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0601', {
        name: 'x',
      }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
  });

  it('updates only provided fields, round-trips JSONB, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'update_me',
      name: 'Before',
      status: QueryDefinitionStatus.Draft,
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: ['old'],
      metadata: { a: 1 },
      settings: { s: 0 },
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: QueryDefinitionStatus.Active,
      defaultLimit: 500,
      tags: ['new'],
      metadata: { b: 2 },
      updatedBy: 'dev-actor-002',
    });
    expect(updated?.status).toBe(QueryDefinitionStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.queryKey).toBe('update_me');
    expect(updated?.defaultLimit).toBe(500);
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

  it('archives a query definition via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'archive_me',
      name: 'Archive Me',
      status: QueryDefinitionStatus.Active,
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    const archived = await repository.archiveByTenantAndId(tenantA, created.id, 'dev-actor-003');
    expect(archived?.status).toBe(QueryDefinitionStatus.Archived);
    expect(archived?.updatedBy).toBe('dev-actor-003');

    // Cross-tenant archive is a no-op.
    expect(await repository.archiveByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      datasetId: datasetA,
      queryKey: 'owned_by_a',
      name: 'Owned By A',
      metrics: [],
      dimensions: [],
      filters: [],
      sorts: [],
      allowedGranularities: [],
      tags: [],
      metadata: {},
      settings: {},
    });

    // tenant B must not be able to update tenant A's query definition.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
