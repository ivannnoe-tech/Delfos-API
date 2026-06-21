import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresUsersRepository } from '../repositories/postgres-users.repository';
import { UserRole, UserStatus } from '../schemas/user.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `users.tenant_id` is an FK to `tenants(id)`, so every user needs a real
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

pgDescribe('PostgresUsersRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresUsersRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresUsersRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a user with a UUID id, the tenant scope and default role/status', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Delfos Operator',
      email: 'operator-create@example.com',
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.name).toBe('Delfos Operator');
    expect(created.email).toBe('operator-create@example.com');
    expect(created.role).toBe(UserRole.Viewer);
    expect(created.status).toBe(UserStatus.Invited);
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('persists explicit role and status', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Admin User',
      email: 'admin-explicit@example.com',
      role: UserRole.Admin,
      status: UserStatus.Active,
    });

    expect(created.role).toBe(UserRole.Admin);
    expect(created.status).toBe(UserStatus.Active);
  });

  it('rejects a duplicate (tenant_id, email) via the unique constraint', async () => {
    await repository.create({ tenantId: tenantA, name: 'Dup One', email: 'dup@example.com' });

    await expect(
      repository.create({ tenantId: tenantA, name: 'Dup Two', email: 'dup@example.com' }),
    ).rejects.toThrow();
  });

  it('allows the same email under a different tenant (tenant isolation on unique index)', async () => {
    await repository.create({ tenantId: tenantA, name: 'Shared A', email: 'shared@example.com' });

    const underB = await repository.create({
      tenantId: tenantB,
      name: 'Shared B',
      email: 'shared@example.com',
    });

    expect(underB.tenantId).toBe(tenantB);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      name: 'List First',
      email: 'list-first@example.com',
    });
    const second = await repository.create({
      tenantId: tenant,
      name: 'List Second',
      email: 'list-second@example.com',
    });
    // A user under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      name: 'Other Tenant',
      email: 'list-other@example.com',
    });

    const page = await repository.findByTenant(tenant, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((u) => u.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((u) => u.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByTenant(tenant)).toBe(2);
  });

  it('returns empty/zero and null for non-UUID tenant or user ids', async () => {
    expect(await repository.findByTenant('not-a-uuid', 1, 10)).toEqual([]);
    expect(await repository.countByTenant('not-a-uuid')).toBe(0);
    expect(
      await repository.updateByTenantAndId('not-a-uuid', '662d4f6e7a1c2b00124f0101', {
        name: 'x',
      }),
    ).toBeNull();
    expect(await repository.updateByTenantAndId(tenantA, 'not-a-uuid', { name: 'x' })).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(
      await repository.updateByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0101', { name: 'x' }),
    ).toBeNull();
  });

  it('updates only provided fields, bumps updated_at, and stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      name: 'Before',
      email: 'update-me@example.com',
      role: UserRole.Viewer,
      status: UserStatus.Invited,
    });

    const updated = await repository.updateByTenantAndId(tenantA, created.id, {
      status: UserStatus.Active,
    });
    expect(updated?.status).toBe(UserStatus.Active);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.email).toBe('update-me@example.com');
    expect(updated?.role).toBe(UserRole.Viewer);
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
      email: 'isolation@example.com',
    });

    // tenant B must not be able to update tenant A's user.
    const cross = await repository.updateByTenantAndId(tenantB, created.id, { name: 'Hijacked' });
    expect(cross).toBeNull();

    // The row is untouched and still owned by tenant A.
    const stillA = await repository.findByTenant(tenantA, 1, 50);
    const reread = stillA.find((u) => u.id === created.id);
    expect(reread?.name).toBe('Owned By A');
    expect(reread?.tenantId).toBe(tenantA);
  });
});
