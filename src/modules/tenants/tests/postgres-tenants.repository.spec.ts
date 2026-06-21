import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresTenantsRepository } from '../repositories/postgres-tenants.repository';
import { TenantStatus } from '../schemas/tenant.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

pgDescribe('PostgresTenantsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresTenantsRepository;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresTenantsRepository(testDb.db);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a tenant with a UUID id, echoed JSONB settings and the default status', async () => {
    const created = await repository.create({
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      settings: { onboardingStage: 'foundation' },
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.name).toBe('Acme Analytics');
    expect(created.slug).toBe('acme-analytics');
    expect(created.status).toBe(TenantStatus.Active);
    expect(created.settings).toEqual({ onboardingStage: 'foundation' });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects a duplicate slug via the unique constraint', async () => {
    await repository.create({ name: 'Dup One', slug: 'dup-slug', settings: {} });

    await expect(
      repository.create({ name: 'Dup Two', slug: 'dup-slug', settings: {} }),
    ).rejects.toThrow();
  });

  it('finds by id, and returns null for unknown UUID or non-UUID id', async () => {
    const created = await repository.create({ name: 'Find Me', slug: 'find-me', settings: {} });

    const found = await repository.findById(created.id);
    expect(found?.id).toBe(created.id);

    expect(await repository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await repository.findById('not-a-uuid')).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(await repository.findById('662d4f6e7a1c2b00124f0001')).toBeNull();
  });

  it('paginates ordered by created_at DESC', async () => {
    const a = await repository.create({ name: 'Page A', slug: 'page-a', settings: {} });
    const b = await repository.create({ name: 'Page B', slug: 'page-b', settings: {} });

    const firstPage = await repository.findAll(1, 2);
    expect(firstPage).toHaveLength(2);
    // Newest first: B (created last) precedes A.
    const ids = firstPage.map((t) => t.id);
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id));

    const total = await repository.countAll();
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it('updates only provided fields, bumps updated_at, and returns null for unknown id', async () => {
    const created = await repository.create({
      name: 'Before',
      slug: 'update-me',
      settings: { a: 1 },
    });

    const updated = await repository.updateById(created.id, { status: TenantStatus.Inactive });
    expect(updated?.status).toBe(TenantStatus.Inactive);
    expect(updated?.name).toBe('Before'); // unchanged
    expect(updated?.slug).toBe('update-me');
    expect(updated?.settings).toEqual({ a: 1 });
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.updateById('00000000-0000-0000-0000-000000000000', { name: 'x' }),
    ).toBeNull();
  });
});
