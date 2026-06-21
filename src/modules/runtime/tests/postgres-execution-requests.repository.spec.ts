import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { AdminRole } from '../../auth/types/admin-role';
import { PostgresExecutionRequestsRepository } from '../repositories/postgres-execution-requests.repository';
import { CreateExecutionRequestRecord } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Logical (non-FK) uuid refs used to exercise the definition filters.
const QUERY_DEFINITION_ID = '662d4f6e-7a1c-4b00-924f-000000000601';
const DASHBOARD_DEFINITION_ID = '662d4f6e-7a1c-4b00-924f-000000000701';
const REPORT_DEFINITION_ID = '662d4f6e-7a1c-4b00-924f-000000000801';
const CONNECTION_ID = '662d4f6e-7a1c-4b00-924f-000000000201';
const DATASET_ID = '662d4f6e-7a1c-4b00-924f-000000000501';

/**
 * `execution_requests.tenant_id` is an FK to `tenants(id)`, so every execution
 * request needs a real tenant row first. This helper inserts a tenant directly
 * and returns its UUID.
 */
async function seedTenant(testDb: IsolatedTestDb, slug: string): Promise<string> {
  const row = await testDb.db
    .insertInto('tenants')
    .values({ name: `Tenant ${slug}`, slug, settings: JSON.stringify({}) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

function baseRecord(tenantId: string, requestKey: string): CreateExecutionRequestRecord {
  return {
    tenantId,
    requestKey,
    kind: ExecutionRequestKind.Query,
    status: ExecutionRequestStatus.Accepted,
    mode: ExecutionRequestMode.FutureRuntime,
    metadata: {},
  };
}

pgDescribe('PostgresExecutionRequestsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresExecutionRequestsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresExecutionRequestsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates an execution request with a UUID id, tenant scope, JSONB round-trip and logical refs', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      requestKey: 'exec_req_create',
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: QUERY_DEFINITION_ID,
      dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
      reportDefinitionId: REPORT_DEFINITION_ID,
      connectionId: CONNECTION_ID,
      datasetId: DATASET_ID,
      requestedByActorId: 'dev-actor-001',
      requestedByRole: AdminRole.Operator,
      mode: ExecutionRequestMode.FutureRuntime,
      reason: 'runtime_foundation_only',
      message: 'Runtime foundation request accepted. No real execution was started.',
      metadata: { domain: 'sales', retries: 3, enabled: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.requestKey).toBe('exec_req_create');
    expect(created.kind).toBe(ExecutionRequestKind.Query);
    expect(created.status).toBe(ExecutionRequestStatus.Accepted);
    expect(created.queryDefinitionId).toBe(QUERY_DEFINITION_ID);
    expect(created.dashboardDefinitionId).toBe(DASHBOARD_DEFINITION_ID);
    expect(created.reportDefinitionId).toBe(REPORT_DEFINITION_ID);
    expect(created.connectionId).toBe(CONNECTION_ID);
    expect(created.datasetId).toBe(DATASET_ID);
    expect(created.requestedByActorId).toBe('dev-actor-001');
    expect(created.requestedByRole).toBe(AdminRole.Operator);
    expect(created.mode).toBe(ExecutionRequestMode.FutureRuntime);
    expect(created.reason).toBe('runtime_foundation_only');
    expect(created.message).toBe(
      'Runtime foundation request accepted. No real execution was started.',
    );
    // JSONB round-trips back to JS object values.
    expect(created.metadata).toEqual({ domain: 'sales', retries: 3, enabled: true });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('leaves unset optional refs undefined and round-trips an empty metadata object', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      requestKey: 'exec_req_defaults',
      kind: ExecutionRequestKind.Dashboard,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
    });

    expect(created.queryDefinitionId).toBeUndefined();
    expect(created.dashboardDefinitionId).toBeUndefined();
    expect(created.reportDefinitionId).toBeUndefined();
    expect(created.connectionId).toBeUndefined();
    expect(created.datasetId).toBeUndefined();
    expect(created.requestedByActorId).toBeUndefined();
    expect(created.requestedByRole).toBeUndefined();
    expect(created.reason).toBeUndefined();
    expect(created.message).toBeUndefined();
    expect(created.metadata).toEqual({});
  });

  it('rejects a duplicate (tenant_id, request_key) via the unique constraint', async () => {
    await repository.create(baseRecord(tenantA, 'dup_request_key'));

    await expect(repository.create(baseRecord(tenantA, 'dup_request_key'))).rejects.toThrow();
  });

  it('allows the same request_key under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create(baseRecord(tenantA, 'shared_request_key'));

    const underB = await repository.create(baseRecord(tenantB, 'shared_request_key'));

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      ...baseRecord(tenant, 'list_first'),
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: QUERY_DEFINITION_ID,
    });
    const second = await repository.create({
      ...baseRecord(tenant, 'list_second'),
      kind: ExecutionRequestKind.Dashboard,
      status: ExecutionRequestStatus.Blocked,
      mode: ExecutionRequestMode.DryRun,
      dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
    });
    // A request under another tenant must not leak into this tenant's list/count.
    await repository.create(baseRecord(tenantB, 'list_other'));

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((d) => d.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((d) => d.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);

    // Filters narrow within the tenant scope.
    expect(
      await repository.countByFilters({ tenantId: tenant, kind: ExecutionRequestKind.Query }),
    ).toBe(1);
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        status: ExecutionRequestStatus.Blocked,
      }),
    ).toBe(1);
    expect(
      await repository.countByFilters({ tenantId: tenant, mode: ExecutionRequestMode.DryRun }),
    ).toBe(1);

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

  it('finds an execution request by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      ...baseRecord(tenantA, 'find_me'),
      metadata: { k: 'v' },
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.metadata).toEqual({ k: 'v' });

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

  it('returns empty/zero and null for a non-UUID tenant or execution request id', async () => {
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(await repository.findByTenantAndId('not-a-uuid', tenantA)).toBeNull();
    expect(
      await repository.updateStatusByTenantAndId(
        'not-a-uuid',
        '662d4f6e7a1c2b00124f0901',
        ExecutionRequestStatus.Blocked,
      ),
    ).toBeNull();
    expect(
      await repository.updateStatusByTenantAndId(
        tenantA,
        'not-a-uuid',
        ExecutionRequestStatus.Blocked,
      ),
    ).toBeNull();
  });

  it('updates status, bumps updated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      ...baseRecord(tenantA, 'update_status'),
      status: ExecutionRequestStatus.Accepted,
    });

    const updated = await repository.updateStatusByTenantAndId(
      tenantA,
      created.id,
      ExecutionRequestStatus.Blocked,
    );
    expect(updated?.status).toBe(ExecutionRequestStatus.Blocked);
    expect(updated?.requestKey).toBe('update_status'); // unchanged
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateStatusByTenantAndId(
        tenantA,
        '00000000-0000-0000-0000-000000000000',
        ExecutionRequestStatus.Blocked,
      ),
    ).toBeNull();
  });

  it('does not update a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create(baseRecord(tenantA, 'owned_by_a'));

    // tenant B must not be able to update tenant A's execution request.
    const cross = await repository.updateStatusByTenantAndId(
      tenantB,
      created.id,
      ExecutionRequestStatus.Failed,
    );
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.status).toBe(ExecutionRequestStatus.Accepted);
    expect(reread?.tenantId).toBe(tenantA);
  });
});
