import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresReportDefinitionsRepository } from '../repositories/postgres-report-definitions.repository';
import {
  ReportDefinitionBlockType,
  ReportDefinitionFilterOperator,
  ReportDefinitionLayoutDensity,
  ReportDefinitionLayoutType,
  ReportDefinitionParameterType,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Logical (non-FK) uuid refs used to exercise the query/dashboard filters.
const QUERY_DEFINITION_ID = '662d4f6e-7a1c-4b00-924f-000000000601';
const DASHBOARD_DEFINITION_ID = '662d4f6e-7a1c-4b00-924f-000000000701';

/**
 * `report_definitions.tenant_id` is an FK to `tenants(id)`, so every report
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

function baseRecord(): {
  layout: { type: ReportDefinitionLayoutType };
  sections: [];
  blocks: [];
  filters: [];
  parameters: [];
  exportOptions: Record<string, never>;
  tags: [];
  metadata: Record<string, never>;
  settings: Record<string, never>;
} {
  return {
    layout: { type: ReportDefinitionLayoutType.Paged },
    sections: [],
    blocks: [],
    filters: [],
    parameters: [],
    exportOptions: {},
    tags: [],
    metadata: {},
    settings: {},
  };
}

pgDescribe('PostgresReportDefinitionsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresReportDefinitionsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresReportDefinitionsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a report definition with a UUID id, tenant scope, JSONB round-trip and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      reportKey: 'monthly_sales_report',
      name: 'Relatorio mensal de vendas',
      queryDefinitionId: QUERY_DEFINITION_ID,
      dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
      layout: {
        type: ReportDefinitionLayoutType.Paged,
        columns: 12,
        density: ReportDefinitionLayoutDensity.Comfortable,
      },
      sections: [
        {
          key: 'summary',
          title: 'Resumo',
          description: 'Indicadores principais',
          order: 1,
          layout: { type: ReportDefinitionLayoutType.Sections, columns: 12 },
        },
      ],
      blocks: [
        {
          key: 'sales_table',
          title: 'Tabela de vendas',
          type: ReportDefinitionBlockType.Table,
          queryDefinitionId: QUERY_DEFINITION_ID,
          dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
          sectionKey: 'summary',
          order: 1,
          options: { showTotals: true },
        },
      ],
      filters: [
        {
          key: 'period',
          label: 'Periodo',
          field: 'created_at',
          operator: ReportDefinitionFilterOperator.DateRange,
          required: true,
          defaultValue: 'last_30_days',
          allowedValues: ['last_7_days', 'last_30_days'],
        },
      ],
      parameters: [
        {
          key: 'tenant_period',
          label: 'Periodo do relatorio',
          type: ReportDefinitionParameterType.DateRange,
          required: true,
          defaultValue: 'last_30_days',
          allowedValues: ['last_30_days', true, null],
        },
      ],
      exportOptions: { defaultFormat: 'pdf', includeFilters: true },
      tags: ['sales', 'monthly'],
      metadata: { domain: 'sales', retries: 3, enabled: true },
      settings: { visibleInBuilder: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.reportKey).toBe('monthly_sales_report');
    expect(created.name).toBe('Relatorio mensal de vendas');
    expect(created.queryDefinitionId).toBe(QUERY_DEFINITION_ID);
    expect(created.dashboardDefinitionId).toBe(DASHBOARD_DEFINITION_ID);
    // Unset optionals fall back to the column defaults.
    expect(created.status).toBe(ReportDefinitionStatus.Draft);
    expect(created.visibility).toBe(ReportDefinitionVisibility.Tenant);
    expect(created.description).toBeUndefined();
    expect(created.createdBy).toBeUndefined();
    expect(created.updatedBy).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.layout).toEqual({
      type: ReportDefinitionLayoutType.Paged,
      columns: 12,
      density: ReportDefinitionLayoutDensity.Comfortable,
    });
    expect(created.sections).toEqual([
      {
        key: 'summary',
        title: 'Resumo',
        description: 'Indicadores principais',
        order: 1,
        layout: { type: ReportDefinitionLayoutType.Sections, columns: 12 },
      },
    ]);
    expect(created.blocks).toEqual([
      {
        key: 'sales_table',
        title: 'Tabela de vendas',
        type: ReportDefinitionBlockType.Table,
        queryDefinitionId: QUERY_DEFINITION_ID,
        dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
        sectionKey: 'summary',
        order: 1,
        options: { showTotals: true },
      },
    ]);
    expect(created.filters).toEqual([
      {
        key: 'period',
        label: 'Periodo',
        field: 'created_at',
        operator: ReportDefinitionFilterOperator.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_7_days', 'last_30_days'],
      },
    ]);
    expect(created.parameters).toEqual([
      {
        key: 'tenant_period',
        label: 'Periodo do relatorio',
        type: ReportDefinitionParameterType.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_30_days', true, null],
      },
    ]);
    expect(created.exportOptions).toEqual({ defaultFormat: 'pdf', includeFilters: true });
    expect(created.tags).toEqual(['sales', 'monthly']);
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.settings).toEqual({ visibleInBuilder: true });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit enum, description and actor values', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      reportKey: 'explicit_report',
      name: 'Explicit report',
      description: 'Has explicit values',
      status: ReportDefinitionStatus.Active,
      visibility: ReportDefinitionVisibility.Private,
      ...baseRecord(),
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.description).toBe('Has explicit values');
    expect(created.status).toBe(ReportDefinitionStatus.Active);
    expect(created.visibility).toBe(ReportDefinitionVisibility.Private);
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.updatedBy).toBe('dev-actor-001');
  });

  it('rejects a duplicate (tenant_id, report_key) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      reportKey: 'dup_report',
      name: 'Dup One',
      ...baseRecord(),
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        reportKey: 'dup_report',
        name: 'Dup Two',
        ...baseRecord(),
      }),
    ).rejects.toThrow();
  });

  it('allows the same report_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      reportKey: 'shared_key',
      name: 'Shared A',
      ...baseRecord(),
    });

    const underB = await repository.create({
      tenantId: tenantB,
      reportKey: 'shared_key',
      name: 'Shared B',
      ...baseRecord(),
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      reportKey: 'list_first',
      name: 'List First',
      status: ReportDefinitionStatus.Active,
      visibility: ReportDefinitionVisibility.Tenant,
      ...baseRecord(),
      queryDefinitionId: QUERY_DEFINITION_ID,
    });
    const second = await repository.create({
      tenantId: tenant,
      reportKey: 'list_second',
      name: 'List Second',
      status: ReportDefinitionStatus.Active,
      visibility: ReportDefinitionVisibility.Private,
      ...baseRecord(),
      dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
    });
    // A report under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      reportKey: 'list_other',
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
    const privateOnly = await repository.findByFilters(
      { tenantId: tenant, visibility: ReportDefinitionVisibility.Private },
      1,
      10,
    );
    expect(privateOnly).toHaveLength(1);
    expect(privateOnly[0]?.id).toBe(second.id);
    expect(await repository.countByFilters({ tenantId: tenant, reportKey: 'list_first' })).toBe(1);
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        status: ReportDefinitionStatus.Active,
      }),
    ).toBe(2);
    // Logical query/dashboard ref filters narrow within the tenant scope.
    const byQuery = await repository.findByFilters(
      { tenantId: tenant, queryDefinitionId: QUERY_DEFINITION_ID },
      1,
      10,
    );
    expect(byQuery).toHaveLength(1);
    expect(byQuery[0]?.id).toBe(first.id);
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
      }),
    ).toBe(1);
  });

  it('finds a report definition by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      reportKey: 'find_me',
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

  it('returns empty/zero and null for a non-UUID tenant or report definition id', async () => {
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
      reportKey: 'update_me',
      name: 'Before',
      status: ReportDefinitionStatus.Draft,
      ...baseRecord(),
      tags: ['old'],
      metadata: { a: 1 },
      settings: { s: 0 },
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: ReportDefinitionStatus.Active,
      tags: ['new'],
      metadata: { b: 2 },
      queryDefinitionId: QUERY_DEFINITION_ID,
      parameters: [
        {
          key: 'added_param',
          label: 'Added parameter',
          type: ReportDefinitionParameterType.String,
          required: false,
          allowedValues: [],
        },
      ],
      blocks: [
        {
          key: 'added',
          title: 'Added block',
          type: ReportDefinitionBlockType.Text,
          order: 0,
          options: {},
        },
      ],
      updatedBy: 'dev-actor-002',
    });
    expect(updated?.status).toBe(ReportDefinitionStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.reportKey).toBe('update_me');
    expect(updated?.tags).toEqual(['new']);
    expect(updated?.metadata).toEqual({ b: 2 });
    expect(updated?.settings).toEqual({ s: 0 }); // unchanged
    expect(updated?.queryDefinitionId).toBe(QUERY_DEFINITION_ID);
    expect(updated?.parameters).toEqual([
      {
        key: 'added_param',
        label: 'Added parameter',
        type: ReportDefinitionParameterType.String,
        required: false,
        allowedValues: [],
      },
    ]);
    expect(updated?.blocks).toEqual([
      {
        key: 'added',
        title: 'Added block',
        type: ReportDefinitionBlockType.Text,
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

  it('archives a report definition via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      reportKey: 'archive_me',
      name: 'Archive Me',
      status: ReportDefinitionStatus.Active,
      ...baseRecord(),
    });

    const archived = await repository.archiveByTenantAndId(tenantA, created.id, 'dev-actor-003');
    expect(archived?.status).toBe(ReportDefinitionStatus.Archived);
    expect(archived?.updatedBy).toBe('dev-actor-003');

    // Cross-tenant archive is a no-op.
    expect(await repository.archiveByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      reportKey: 'owned_by_a',
      name: 'Owned By A',
      ...baseRecord(),
    });

    // tenant B must not be able to update tenant A's report definition.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
