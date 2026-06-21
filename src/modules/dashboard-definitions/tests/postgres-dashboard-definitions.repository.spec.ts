import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresDashboardDefinitionsRepository } from '../repositories/postgres-dashboard-definitions.repository';
import {
  DashboardDefinitionChartType,
  DashboardDefinitionFilterOperator,
  DashboardDefinitionLayoutDensity,
  DashboardDefinitionLayoutGap,
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../schemas/dashboard-definition.schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `dashboard_definitions.tenant_id` is an FK to `tenants(id)`, so every
 * dashboard definition needs a real tenant row first. This helper inserts a
 * tenant directly and returns its UUID.
 */
async function seedTenant(testDb: IsolatedTestDb, slug: string): Promise<string> {
  const row = await testDb.db
    .insertInto('tenants')
    .values({ name: `Tenant ${slug}`, slug, settings: JSON.stringify({}) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

function baseRecord(): {
  layout: { type: DashboardDefinitionLayoutType };
  sections: [];
  widgets: [];
  filters: [];
  tags: [];
  metadata: Record<string, never>;
  settings: Record<string, never>;
} {
  return {
    layout: { type: DashboardDefinitionLayoutType.Grid },
    sections: [],
    widgets: [],
    filters: [],
    tags: [],
    metadata: {},
    settings: {},
  };
}

pgDescribe('PostgresDashboardDefinitionsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresDashboardDefinitionsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresDashboardDefinitionsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a dashboard definition with a UUID id, tenant scope, JSONB round-trip and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'sales_dashboard',
      name: 'Dashboard de vendas',
      layout: {
        type: DashboardDefinitionLayoutType.Grid,
        columns: 12,
        gap: DashboardDefinitionLayoutGap.Md,
        density: DashboardDefinitionLayoutDensity.Comfortable,
      },
      sections: [
        {
          key: 'overview',
          title: 'Visao geral',
          description: 'Indicadores principais',
          order: 1,
          layout: { type: DashboardDefinitionLayoutType.Grid, columns: 12 },
        },
      ],
      widgets: [
        {
          key: 'total_sales',
          title: 'Vendas totais',
          type: DashboardDefinitionWidgetType.MetricCard,
          queryDefinitionId: '662d4f6e7a1c2b00124f0601',
          sectionKey: 'overview',
          order: 1,
          size: { cols: 3, rows: 1 },
          position: { x: 0, y: 0 },
          visualization: {
            chartType: DashboardDefinitionChartType.Number,
            yFields: [],
            format: 'currency',
          },
          options: { showTrend: true },
        },
      ],
      filters: [
        {
          key: 'period',
          label: 'Periodo',
          field: 'created_at',
          operator: DashboardDefinitionFilterOperator.DateRange,
          required: true,
          defaultValue: 'last_30_days',
          allowedValues: ['last_7_days', 'last_30_days'],
        },
      ],
      tags: ['sales', 'overview'],
      metadata: { domain: 'sales', retries: 3, enabled: true },
      settings: { visibleInBuilder: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.dashboardKey).toBe('sales_dashboard');
    expect(created.name).toBe('Dashboard de vendas');
    // Unset optionals fall back to the column defaults.
    expect(created.status).toBe(DashboardDefinitionStatus.Draft);
    expect(created.visibility).toBe(DashboardDefinitionVisibility.Tenant);
    expect(created.description).toBeUndefined();
    expect(created.createdBy).toBeUndefined();
    expect(created.updatedBy).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.layout).toEqual({
      type: DashboardDefinitionLayoutType.Grid,
      columns: 12,
      gap: DashboardDefinitionLayoutGap.Md,
      density: DashboardDefinitionLayoutDensity.Comfortable,
    });
    expect(created.sections).toEqual([
      {
        key: 'overview',
        title: 'Visao geral',
        description: 'Indicadores principais',
        order: 1,
        layout: { type: DashboardDefinitionLayoutType.Grid, columns: 12 },
      },
    ]);
    expect(created.widgets).toEqual([
      {
        key: 'total_sales',
        title: 'Vendas totais',
        type: DashboardDefinitionWidgetType.MetricCard,
        queryDefinitionId: '662d4f6e7a1c2b00124f0601',
        sectionKey: 'overview',
        order: 1,
        size: { cols: 3, rows: 1 },
        position: { x: 0, y: 0 },
        visualization: {
          chartType: DashboardDefinitionChartType.Number,
          yFields: [],
          format: 'currency',
        },
        options: { showTrend: true },
      },
    ]);
    expect(created.filters).toEqual([
      {
        key: 'period',
        label: 'Periodo',
        field: 'created_at',
        operator: DashboardDefinitionFilterOperator.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_7_days', 'last_30_days'],
      },
    ]);
    expect(created.tags).toEqual(['sales', 'overview']);
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.settings).toEqual({ visibleInBuilder: true });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit enum, description and actor values', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'explicit_dashboard',
      name: 'Explicit dashboard',
      description: 'Has explicit values',
      status: DashboardDefinitionStatus.Active,
      visibility: DashboardDefinitionVisibility.Private,
      ...baseRecord(),
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.description).toBe('Has explicit values');
    expect(created.status).toBe(DashboardDefinitionStatus.Active);
    expect(created.visibility).toBe(DashboardDefinitionVisibility.Private);
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.updatedBy).toBe('dev-actor-001');
  });

  it('rejects a duplicate (tenant_id, dashboard_key) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      dashboardKey: 'dup_dashboard',
      name: 'Dup One',
      ...baseRecord(),
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        dashboardKey: 'dup_dashboard',
        name: 'Dup Two',
        ...baseRecord(),
      }),
    ).rejects.toThrow();
  });

  it('allows the same dashboard_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      dashboardKey: 'shared_key',
      name: 'Shared A',
      ...baseRecord(),
    });

    const underB = await repository.create({
      tenantId: tenantB,
      dashboardKey: 'shared_key',
      name: 'Shared B',
      ...baseRecord(),
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      dashboardKey: 'list_first',
      name: 'List First',
      status: DashboardDefinitionStatus.Active,
      visibility: DashboardDefinitionVisibility.Tenant,
      ...baseRecord(),
    });
    const second = await repository.create({
      tenantId: tenant,
      dashboardKey: 'list_second',
      name: 'List Second',
      status: DashboardDefinitionStatus.Active,
      visibility: DashboardDefinitionVisibility.Public,
      ...baseRecord(),
    });
    // A dashboard under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      dashboardKey: 'list_other',
      name: 'Other Tenant',
      ...baseRecord(),
    });

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((d) => d.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((d) => d.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);

    // Filters narrow within the tenant scope.
    const publicOnly = await repository.findByFilters(
      { tenantId: tenant, visibility: DashboardDefinitionVisibility.Public },
      1,
      10,
    );
    expect(publicOnly).toHaveLength(1);
    expect(publicOnly[0]?.id).toBe(second.id);
    expect(await repository.countByFilters({ tenantId: tenant, dashboardKey: 'list_first' })).toBe(
      1,
    );
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        status: DashboardDefinitionStatus.Active,
      }),
    ).toBe(2);
  });

  it('finds a dashboard definition by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'find_me',
      name: 'Find Me',
      ...baseRecord(),
      tags: ['x'],
      metadata: { k: 'v' },
      settings: { s: 1 },
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
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
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0701')).toBeNull();
  });

  it('returns empty/zero and null for a non-UUID tenant or dashboard definition id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0701', {
        name: 'x',
      }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
  });

  it('updates only provided fields, round-trips JSONB, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'update_me',
      name: 'Before',
      status: DashboardDefinitionStatus.Draft,
      ...baseRecord(),
      tags: ['old'],
      metadata: { a: 1 },
      settings: { s: 0 },
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: DashboardDefinitionStatus.Active,
      tags: ['new'],
      metadata: { b: 2 },
      widgets: [
        {
          key: 'added',
          title: 'Added widget',
          type: DashboardDefinitionWidgetType.Chart,
          order: 0,
          options: {},
        },
      ],
      updatedBy: 'dev-actor-002',
    });
    expect(updated?.status).toBe(DashboardDefinitionStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.dashboardKey).toBe('update_me');
    expect(updated?.tags).toEqual(['new']);
    expect(updated?.metadata).toEqual({ b: 2 });
    expect(updated?.settings).toEqual({ s: 0 }); // unchanged
    expect(updated?.widgets).toEqual([
      {
        key: 'added',
        title: 'Added widget',
        type: DashboardDefinitionWidgetType.Chart,
        order: 0,
        options: {},
      },
    ]);
    expect(updated?.updatedBy).toBe('dev-actor-002');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        name: 'x',
      }),
    ).toBeNull();
  });

  it('archives a dashboard definition via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'archive_me',
      name: 'Archive Me',
      status: DashboardDefinitionStatus.Active,
      ...baseRecord(),
    });

    const archived = await repository.archiveByTenantAndId(tenantA, created.id, 'dev-actor-003');
    expect(archived?.status).toBe(DashboardDefinitionStatus.Archived);
    expect(archived?.updatedBy).toBe('dev-actor-003');

    // Cross-tenant archive is a no-op.
    expect(await repository.archiveByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      dashboardKey: 'owned_by_a',
      name: 'Owned By A',
      ...baseRecord(),
    });

    // tenant B must not be able to update tenant A's dashboard definition.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
