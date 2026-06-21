import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { AdminRole } from '../../auth/types/admin-role';
import { PostgresExecutionRequestEventsRepository } from '../repositories/postgres-execution-request-events.repository';
import { PostgresExecutionRequestsRepository } from '../repositories/postgres-execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function seedTenant(testDb: IsolatedTestDb, slug: string): Promise<string> {
  const row = await testDb.db
    .insertInto('tenants')
    .values({ name: `Tenant ${slug}`, slug, settings: JSON.stringify({}) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

pgDescribe('PostgresExecutionRequestEventsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresExecutionRequestEventsRepository;
  let requestsRepository: PostgresExecutionRequestsRepository;
  let tenantA: string;
  let tenantB: string;
  let requestA: string; // execution request id under tenant A
  let requestKeyA: string;
  let requestB: string; // execution request id under tenant B

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresExecutionRequestEventsRepository(testDb.db);
    requestsRepository = new PostgresExecutionRequestsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');

    const createdA = await requestsRepository.create({
      tenantId: tenantA,
      requestKey: 'exec_req_events_a',
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
    });
    requestA = createdA.id;
    requestKeyA = createdA.requestKey;

    const createdB = await requestsRepository.create({
      tenantId: tenantB,
      requestKey: 'exec_req_events_b',
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
    });
    requestB = createdB.id;
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates an event with a UUID id, FK to the request, JSONB round-trip and created_at only', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      executionRequestId: requestA,
      requestKey: requestKeyA,
      eventType: ExecutionRequestEventType.StatusChanged,
      previousStatus: ExecutionRequestStatus.Accepted,
      nextStatus: ExecutionRequestStatus.Blocked,
      message: 'Blocked by foundation policy.',
      reason: 'runtime_foundation_only',
      actorId: 'dev-actor-001',
      actorRole: AdminRole.Operator,
      metadata: { domain: 'sales', enabled: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.executionRequestId).toBe(requestA);
    expect(created.requestKey).toBe(requestKeyA);
    expect(created.eventType).toBe(ExecutionRequestEventType.StatusChanged);
    expect(created.previousStatus).toBe(ExecutionRequestStatus.Accepted);
    expect(created.nextStatus).toBe(ExecutionRequestStatus.Blocked);
    expect(created.message).toBe('Blocked by foundation policy.');
    expect(created.reason).toBe('runtime_foundation_only');
    expect(created.actorId).toBe('dev-actor-001');
    expect(created.actorRole).toBe(AdminRole.Operator);
    expect(created.metadata).toEqual({ domain: 'sales', enabled: true });
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('leaves unset optionals undefined and defaults metadata to an empty object', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      executionRequestId: requestA,
      requestKey: requestKeyA,
      eventType: ExecutionRequestEventType.NoteAdded,
      metadata: {},
    });

    expect(created.previousStatus).toBeUndefined();
    expect(created.nextStatus).toBeUndefined();
    expect(created.message).toBeUndefined();
    expect(created.reason).toBeUndefined();
    expect(created.actorId).toBeUndefined();
    expect(created.actorRole).toBeUndefined();
    expect(created.metadata).toEqual({});
  });

  it('rejects an event referencing a non-existent execution request via the FK', async () => {
    await expect(
      repository.create({
        tenantId: tenantA,
        executionRequestId: '00000000-0000-0000-0000-000000000000',
        requestKey: 'orphan',
        eventType: ExecutionRequestEventType.NoteAdded,
        metadata: {},
      }),
    ).rejects.toThrow();
  });

  it('lists and counts only the requesting tenant + request, ordered by created_at DESC, honoring filters', async () => {
    const tenant = await seedTenant(testDb, 'events-list-scope');
    const created = await requestsRepository.create({
      tenantId: tenant,
      requestKey: 'exec_req_events_scope',
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
    });
    const request = created.id;
    const requestKey = created.requestKey;

    const first = await repository.create({
      tenantId: tenant,
      executionRequestId: request,
      requestKey,
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
      metadata: {},
    });
    const second = await repository.create({
      tenantId: tenant,
      executionRequestId: request,
      requestKey,
      eventType: ExecutionRequestEventType.Blocked,
      nextStatus: ExecutionRequestStatus.Blocked,
      metadata: {},
    });

    const page = await repository.findByFilters(
      { tenantId: tenant, executionRequestId: request },
      1,
      10,
    );
    expect(page).toHaveLength(2);
    expect(page.every((e) => e.tenantId === tenant && e.executionRequestId === request)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((e) => e.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant, executionRequestId: request })).toBe(
      2,
    );

    // eventType filter narrows within the tenant + request scope.
    const blockedOnly = await repository.findByFilters(
      {
        tenantId: tenant,
        executionRequestId: request,
        eventType: ExecutionRequestEventType.Blocked,
      },
      1,
      10,
    );
    expect(blockedOnly).toHaveLength(1);
    expect(blockedOnly[0]?.id).toBe(second.id);
    expect(
      await repository.countByFilters({
        tenantId: tenant,
        executionRequestId: request,
        eventType: ExecutionRequestEventType.Accepted,
      }),
    ).toBe(1);
  });

  it('does not leak events across tenants even for the same request id (tenant isolation)', async () => {
    const event = await repository.create({
      tenantId: tenantA,
      executionRequestId: requestA,
      requestKey: requestKeyA,
      eventType: ExecutionRequestEventType.NoteAdded,
      metadata: {},
    });

    // Tenant B cannot see tenant A's events for tenant A's request.
    const underB = await repository.findByFilters(
      { tenantId: tenantB, executionRequestId: requestA },
      1,
      10,
    );
    expect(underB).toEqual([]);
    expect(
      await repository.countByFilters({ tenantId: tenantB, executionRequestId: requestA }),
    ).toBe(0);

    // And tenant A's filter on tenant B's request returns nothing.
    expect(
      await repository.findByFilters({ tenantId: tenantA, executionRequestId: requestB }, 1, 10),
    ).toEqual([]);

    // The event is still visible under its own tenant + request scope.
    const underA = await repository.findByFilters(
      { tenantId: tenantA, executionRequestId: requestA },
      1,
      10,
    );
    expect(underA.some((e) => e.id === event.id)).toBe(true);
  });

  it('returns empty/zero for a non-UUID tenant or execution request id', async () => {
    expect(
      await repository.findByFilters(
        { tenantId: 'not-a-uuid', executionRequestId: requestA },
        1,
        10,
      ),
    ).toEqual([]);
    expect(
      await repository.findByFilters(
        { tenantId: tenantA, executionRequestId: 'not-a-uuid' },
        1,
        10,
      ),
    ).toEqual([]);
    expect(
      await repository.countByFilters({ tenantId: 'not-a-uuid', executionRequestId: requestA }),
    ).toBe(0);
    expect(
      await repository.countByFilters({ tenantId: tenantA, executionRequestId: 'not-a-uuid' }),
    ).toBe(0);
  });
});
