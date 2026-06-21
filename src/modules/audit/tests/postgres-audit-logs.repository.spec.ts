import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresAuditLogsRepository } from '../repositories/postgres-audit-logs.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

pgDescribe('PostgresAuditLogsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresAuditLogsRepository;
  let tenantA: string;
  let tenantB: string;
  let actorA: string;

  async function createTenant(slug: string): Promise<string> {
    const row = await testDb.db
      .insertInto('tenants')
      .values({ name: slug, slug, settings: JSON.stringify({}) })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  async function createUser(tenantId: string, email: string): Promise<string> {
    const row = await testDb.db
      .insertInto('users')
      .values({ tenant_id: tenantId, name: email, email })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresAuditLogsRepository(testDb.db);
    tenantA = await createTenant('tenant-a');
    tenantB = await createTenant('tenant-b');
    actorA = await createUser(tenantA, 'actor-a@example.com');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates an audit log with a UUID id, echoed JSONB metadata and a timestamp', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      actorUserId: actorA,
      action: 'connection.created',
      entity: 'connection',
      entityId: 'conn-123',
      metadata: { status: 'draft', count: 2, active: true },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.actorUserId).toBe(actorA);
    expect(created.action).toBe('connection.created');
    expect(created.entity).toBe('connection');
    expect(created.entityId).toBe('conn-123');
    expect(created.metadata).toEqual({ status: 'draft', count: 2, active: true });
    expect(created.timestamp).toBeInstanceOf(Date);
  });

  it('persists an audit log without an optional actor or entity id, defaulting metadata', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      action: 'tenant.viewed',
      entity: 'tenant',
      metadata: {},
    });

    expect(created.actorUserId).toBeUndefined();
    expect(created.entityId).toBeUndefined();
    expect(created.metadata).toEqual({});

    const stored = await testDb.db
      .selectFrom('audit_logs')
      .selectAll()
      .where('id', '=', created.id)
      .executeTakeFirstOrThrow();
    expect(stored.actor_user_id).toBeNull();
    expect(stored.entity_id).toBeNull();
    expect(stored.metadata).toEqual({});
  });

  it('scopes rows to the owning tenant (tenant isolation)', async () => {
    const underA = await repository.create({
      tenantId: tenantA,
      action: 'dataset.created',
      entity: 'dataset',
      metadata: { scope: 'a' },
    });
    const underB = await repository.create({
      tenantId: tenantB,
      action: 'dataset.created',
      entity: 'dataset',
      metadata: { scope: 'b' },
    });

    expect(underA.tenantId).toBe(tenantA);
    expect(underB.tenantId).toBe(tenantB);

    // A row created under tenant A is not visible when filtering by tenant B.
    const visibleUnderB = await testDb.db
      .selectFrom('audit_logs')
      .selectAll()
      .where('id', '=', underA.id)
      .where('tenant_id', '=', tenantB)
      .executeTakeFirst();
    expect(visibleUnderB).toBeUndefined();

    // ...but it is visible under its own tenant.
    const visibleUnderA = await testDb.db
      .selectFrom('audit_logs')
      .selectAll()
      .where('id', '=', underA.id)
      .where('tenant_id', '=', tenantA)
      .executeTakeFirst();
    expect(visibleUnderA?.id).toBe(underA.id);
  });

  it('round-trips JSONB metadata as a structured object', async () => {
    const metadata = { a: 'x', n: 7, flag: false, nothing: null };
    const created = await repository.create({
      tenantId: tenantB,
      action: 'report.created',
      entity: 'report',
      metadata,
    });

    const stored = await testDb.db
      .selectFrom('audit_logs')
      .select('metadata')
      .where('id', '=', created.id)
      .executeTakeFirstOrThrow();

    expect(stored.metadata).toEqual(metadata);
    expect(created.metadata).toEqual(metadata);
  });

  it('rejects an audit log for a non-existent tenant via the FK constraint', async () => {
    await expect(
      repository.create({
        tenantId: '00000000-0000-0000-0000-000000000000',
        action: 'connection.created',
        entity: 'connection',
        metadata: {},
      }),
    ).rejects.toThrow();
  });
});
