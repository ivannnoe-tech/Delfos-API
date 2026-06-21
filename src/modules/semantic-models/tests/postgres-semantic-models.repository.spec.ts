import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresSemanticModelsRepository } from '../repositories/postgres-semantic-models.repository';
import {
  SemanticDimensionDomain,
  SemanticMeasureAggregation,
  SemanticModelStatus,
  SemanticQualityLevel,
  SemanticType,
} from '../schemas/semantic-model.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `semantic_models.tenant_id` is an FK to `tenants(id)`, so every semantic model
 * needs a real tenant row first. This helper inserts a tenant directly and
 * returns its UUID.
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
  datasetKeys: [];
  tags: [];
  quality: { warnings: [] };
  measures: [];
  dimensions: [];
  glossaryTerms: [];
  metadata: Record<string, never>;
  settings: Record<string, never>;
} {
  return {
    datasetKeys: [],
    tags: [],
    quality: { warnings: [] },
    measures: [],
    dimensions: [],
    glossaryTerms: [],
    metadata: {},
    settings: {},
  };
}

pgDescribe('PostgresSemanticModelsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresSemanticModelsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresSemanticModelsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a semantic model with a UUID id, tenant scope, JSONB round-trip and column defaults', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'comercial_semantico',
      name: 'Modelo semantico comercial',
      datasetKeys: ['sales_orders_demo', 'customers_demo'],
      tags: ['comercial', 'foundation'],
      quality: {
        score: 72,
        level: SemanticQualityLevel.Good,
        warnings: ['Modelo sem steward.'],
      },
      measures: [
        {
          key: 'faturamento',
          name: 'Faturamento',
          aggregation: SemanticMeasureAggregation.Sum,
          semanticType: SemanticType.Currency,
          datasetKey: 'sales_orders_demo',
          fieldKey: 'total_amount',
          status: SemanticModelStatus.Draft,
          tags: ['comercial'],
          isReusable: true,
          warnings: [],
          metadata: { domain: 'sales' },
        },
      ],
      dimensions: [
        {
          key: 'cidade',
          name: 'Cidade',
          domain: SemanticDimensionDomain.Geography,
          status: SemanticModelStatus.Draft,
          tags: [],
          warnings: [],
          metadata: {},
        },
      ],
      glossaryTerms: [
        {
          key: 'cliente_ativo',
          name: 'Cliente ativo',
          aliases: ['conta ativa'],
          relatedMeasureKeys: ['faturamento'],
          relatedDimensionKeys: [],
          status: SemanticModelStatus.Draft,
          tags: [],
          metadata: {},
        },
      ],
      metadata: { domain: 'sales', retries: 3, enabled: true },
      settings: { visibleInBuilder: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.modelKey).toBe('comercial_semantico');
    expect(created.name).toBe('Modelo semantico comercial');
    // Unset optionals fall back to the column defaults.
    expect(created.status).toBe(SemanticModelStatus.Draft);
    expect(created.description).toBeUndefined();
    expect(created.owner).toBeUndefined();
    expect(created.steward).toBeUndefined();
    expect(created.certificationOwner).toBeUndefined();
    expect(created.createdBy).toBeUndefined();
    expect(created.updatedBy).toBeUndefined();
    // JSONB columns round-trip back to JS array/object values.
    expect(created.datasetKeys).toEqual(['sales_orders_demo', 'customers_demo']);
    expect(created.tags).toEqual(['comercial', 'foundation']);
    expect(created.quality).toEqual({
      score: 72,
      level: SemanticQualityLevel.Good,
      warnings: ['Modelo sem steward.'],
    });
    expect(created.measures).toEqual([
      {
        key: 'faturamento',
        name: 'Faturamento',
        aggregation: SemanticMeasureAggregation.Sum,
        semanticType: SemanticType.Currency,
        datasetKey: 'sales_orders_demo',
        fieldKey: 'total_amount',
        status: SemanticModelStatus.Draft,
        tags: ['comercial'],
        isReusable: true,
        warnings: [],
        metadata: { domain: 'sales' },
      },
    ]);
    expect(created.dimensions).toEqual([
      {
        key: 'cidade',
        name: 'Cidade',
        domain: SemanticDimensionDomain.Geography,
        status: SemanticModelStatus.Draft,
        tags: [],
        warnings: [],
        metadata: {},
      },
    ]);
    expect(created.glossaryTerms).toEqual([
      {
        key: 'cliente_ativo',
        name: 'Cliente ativo',
        aliases: ['conta ativa'],
        relatedMeasureKeys: ['faturamento'],
        relatedDimensionKeys: [],
        status: SemanticModelStatus.Draft,
        tags: [],
        metadata: {},
      },
    ]);
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.settings).toEqual({ visibleInBuilder: true });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit enum, description and actor values', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'explicit_model',
      name: 'Explicit model',
      description: 'Has explicit values',
      status: SemanticModelStatus.Verified,
      owner: 'dev-actor-owner',
      steward: 'dev-actor-steward',
      certificationOwner: 'dev-actor-cert',
      ...baseRecord(),
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.description).toBe('Has explicit values');
    expect(created.status).toBe(SemanticModelStatus.Verified);
    expect(created.owner).toBe('dev-actor-owner');
    expect(created.steward).toBe('dev-actor-steward');
    expect(created.certificationOwner).toBe('dev-actor-cert');
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.updatedBy).toBe('dev-actor-001');
  });

  it('rejects a duplicate (tenant_id, model_key) via the unique constraint', async () => {
    await repository.create({
      tenantId: tenantA,
      modelKey: 'dup_model',
      name: 'Dup One',
      ...baseRecord(),
    });

    await expect(
      repository.create({
        tenantId: tenantA,
        modelKey: 'dup_model',
        name: 'Dup Two',
        ...baseRecord(),
      }),
    ).rejects.toThrow();
  });

  it('allows the same model_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({
      tenantId: tenantA,
      modelKey: 'shared_key',
      name: 'Shared A',
      ...baseRecord(),
    });

    const underB = await repository.create({
      tenantId: tenantB,
      modelKey: 'shared_key',
      name: 'Shared B',
      ...baseRecord(),
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      modelKey: 'list_first',
      name: 'List First',
      status: SemanticModelStatus.Verified,
      ...baseRecord(),
    });
    const second = await repository.create({
      tenantId: tenant,
      modelKey: 'list_second',
      name: 'List Second',
      status: SemanticModelStatus.Draft,
      ...baseRecord(),
    });
    // A model under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      modelKey: 'list_other',
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
    const verifiedOnly = await repository.findByFilters(
      { tenantId: tenant, status: SemanticModelStatus.Verified },
      1,
      10,
    );
    expect(verifiedOnly).toHaveLength(1);
    expect(verifiedOnly[0]?.id).toBe(first.id);
    expect(await repository.countByFilters({ tenantId: tenant, modelKey: 'list_first' })).toBe(1);
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        status: SemanticModelStatus.Draft,
      }),
    ).toBe(1);
  });

  it('finds a semantic model by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'find_me',
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
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0901')).toBeNull();
  });

  it('returns empty/zero and null for a non-UUID tenant or semantic model id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0901', {
        name: 'x',
      }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
  });

  it('updates only provided fields, round-trips JSONB, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'update_me',
      name: 'Before',
      status: SemanticModelStatus.Draft,
      ...baseRecord(),
      tags: ['old'],
      metadata: { a: 1 },
      settings: { s: 0 },
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: SemanticModelStatus.Verified,
      tags: ['new'],
      metadata: { b: 2 },
      measures: [
        {
          key: 'added_measure',
          name: 'Added measure',
          aggregation: SemanticMeasureAggregation.Count,
          status: SemanticModelStatus.Draft,
          tags: [],
          isReusable: false,
          warnings: [],
          metadata: {},
        },
      ],
      updatedBy: 'dev-actor-002',
    });
    expect(updated?.status).toBe(SemanticModelStatus.Verified);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.modelKey).toBe('update_me');
    expect(updated?.tags).toEqual(['new']);
    expect(updated?.metadata).toEqual({ b: 2 });
    expect(updated?.settings).toEqual({ s: 0 }); // unchanged
    expect(updated?.measures).toEqual([
      {
        key: 'added_measure',
        name: 'Added measure',
        aggregation: SemanticMeasureAggregation.Count,
        status: SemanticModelStatus.Draft,
        tags: [],
        isReusable: false,
        warnings: [],
        metadata: {},
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

  it('archives a semantic model via soft delete, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'archive_me',
      name: 'Archive Me',
      status: SemanticModelStatus.Verified,
      ...baseRecord(),
    });

    const archived = await repository.archiveByTenantAndId(tenantA, created.id, 'dev-actor-003');
    expect(archived?.status).toBe(SemanticModelStatus.Archived);
    expect(archived?.updatedBy).toBe('dev-actor-003');

    // Cross-tenant archive is a no-op.
    expect(await repository.archiveByTenantAndId(tenantB, created.id)).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      modelKey: 'owned_by_a',
      name: 'Owned By A',
      ...baseRecord(),
    });

    // tenant B must not be able to update tenant A's semantic model.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
