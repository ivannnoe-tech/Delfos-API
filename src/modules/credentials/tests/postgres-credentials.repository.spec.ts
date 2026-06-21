import {
  createIsolatedTestDb,
  IsolatedTestDb,
  pgDescribe,
} from '../../../database/postgres/tests/pg-test-db';
import { PostgresCredentialsRepository } from '../repositories/postgres-credentials.repository';
import { CredentialStatus, CredentialType } from '../schemas/credential.constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `credentials.tenant_id` is an FK to `tenants(id)`, so every credential needs a
 * real tenant row first. This helper inserts a tenant directly and returns its
 * UUID.
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
 * `credentials.connection_id` is an FK to `connections(id)`. This helper inserts
 * a connection under the given tenant and returns its UUID.
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
      base_url: `https://api.${name}.example`,
      allowed_headers: JSON.stringify([]),
      metadata: JSON.stringify({}),
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

pgDescribe('PostgresCredentialsRepository (real PostgreSQL)', () => {
  let testDb: IsolatedTestDb;
  let repository: PostgresCredentialsRepository;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    testDb = await createIsolatedTestDb();
    repository = new PostgresCredentialsRepository(testDb.db);
    tenantA = await seedTenant(testDb, 'tenant-a');
    tenantB = await seedTenant(testDb, 'tenant-b');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it('creates a credential with a UUID id, tenant scope and defaults, never leaking the secret', async () => {
    const connectionId = await seedConnection(testDb, tenantA, 'create-conn');
    const created = await repository.create({
      tenantId: tenantA,
      connectionId,
      type: CredentialType.ApiKey,
      provider: 'customer-api',
      name: 'Primary credential',
      maskedPreview: '********1234',
      protectedSecretValue: 'local:v1:not-a-real-secret',
      protectionProvider: 'local_aes_256_gcm',
      createdBy: 'dev-actor-001',
      updatedBy: 'dev-actor-001',
    });

    expect(created.id).toMatch(UUID_RE);
    expect(created.tenantId).toBe(tenantA);
    expect(created.connectionId).toBe(connectionId);
    expect(created.type).toBe(CredentialType.ApiKey);
    expect(created.provider).toBe('customer-api');
    expect(created.name).toBe('Primary credential');
    expect(created.maskedPreview).toBe('********1234');
    // Unset optionals fall back to the column default.
    expect(created.status).toBe(CredentialStatus.Active);
    expect(created.createdBy).toBe('dev-actor-001');
    expect(created.rotatedAt).toBeUndefined();
    expect(created.revokedAt).toBeUndefined();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
    // The protected secret value is never carried in the neutral record.
    expect(JSON.stringify(created)).not.toContain('local:v1:not-a-real-secret');
    expect(created).not.toHaveProperty('protectedSecretValue');
  });

  it('persists a credential without an optional connection (null connection_id)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      type: CredentialType.BearerToken,
      name: 'No-connection credential',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:another-secret',
      protectionProvider: 'local_aes_256_gcm',
    });

    expect(created.connectionId).toBeUndefined();
    expect(created.provider).toBeUndefined();
    expect(created.maskedPreview).toBeNull();
    expect(created.status).toBe(CredentialStatus.Active);
  });

  it('lists and counts only the requesting tenant, ordered by created_at DESC', async () => {
    const tenant = await seedTenant(testDb, 'list-scope');
    const first = await repository.create({
      tenantId: tenant,
      type: CredentialType.ApiKey,
      name: 'List First',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:s1',
      protectionProvider: 'local_aes_256_gcm',
    });
    const second = await repository.create({
      tenantId: tenant,
      type: CredentialType.ApiKey,
      name: 'List Second',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:s2',
      protectionProvider: 'local_aes_256_gcm',
    });
    // A credential under another tenant must not leak into this tenant's list/count.
    await repository.create({
      tenantId: tenantB,
      type: CredentialType.ApiKey,
      name: 'Other Tenant',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:other',
      protectionProvider: 'local_aes_256_gcm',
    });

    const page = await repository.findByFilters({ tenantId: tenant }, 1, 10);
    expect(page).toHaveLength(2);
    expect(page.every((c) => c.tenantId === tenant)).toBe(true);
    // Newest first: second (created last) precedes first.
    const ids = page.map((c) => c.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    expect(await repository.countByFilters({ tenantId: tenant })).toBe(2);
  });

  it('filters list and count by connection_id within the tenant scope', async () => {
    const tenant = await seedTenant(testDb, 'conn-filter');
    const connA = await seedConnection(testDb, tenant, 'conn-a');
    const connB = await seedConnection(testDb, tenant, 'conn-b');

    await repository.create({
      tenantId: tenant,
      connectionId: connA,
      type: CredentialType.ApiKey,
      name: 'On A',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:a',
      protectionProvider: 'local_aes_256_gcm',
    });
    await repository.create({
      tenantId: tenant,
      connectionId: connB,
      type: CredentialType.ApiKey,
      name: 'On B',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:b',
      protectionProvider: 'local_aes_256_gcm',
    });

    const onA = await repository.findByFilters({ tenantId: tenant, connectionId: connA }, 1, 10);
    expect(onA).toHaveLength(1);
    expect(onA[0].connectionId).toBe(connA);
    expect(await repository.countByFilters({ tenantId: tenant, connectionId: connA })).toBe(1);

    // Non-UUID tenant/connection filters short-circuit to empty/zero.
    expect(await repository.findByFilters({ tenantId: 'not-a-uuid' }, 1, 10)).toEqual([]);
    expect(await repository.countByFilters({ tenantId: 'not-a-uuid' })).toBe(0);
    expect(
      await repository.findByFilters({ tenantId: tenant, connectionId: 'not-a-uuid' }, 1, 10),
    ).toEqual([]);
    expect(await repository.countByFilters({ tenantId: tenant, connectionId: 'not-a-uuid' })).toBe(
      0,
    );
  });

  it('finds a credential by tenant and id, tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      type: CredentialType.ApiKey,
      name: 'Find Me',
      maskedPreview: '********9999',
      protectedSecretValue: 'local:v1:find',
      protectionProvider: 'local_aes_256_gcm',
    });

    const found = await repository.findByTenantAndId(tenantA, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.maskedPreview).toBe('********9999');
    // The secret is never exposed on read.
    expect(JSON.stringify(found)).not.toContain('local:v1:find');

    // Same id, but under another tenant, is invisible (tenant isolation).
    expect(await repository.findByTenantAndId(tenantB, created.id)).toBeNull();
    // Unknown UUID and non-UUID ids return null.
    expect(
      await repository.findByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000'),
    ).toBeNull();
    expect(await repository.findByTenantAndId(tenantA, 'not-a-uuid')).toBeNull();
    // A legacy Mongo-ObjectId-shaped id is accepted by validation but absent here.
    expect(await repository.findByTenantAndId(tenantA, '662d4f6e7a1c2b00124f0401')).toBeNull();
  });

  it('rotates a credential, bumps updated_at and rotated_at, stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      type: CredentialType.ApiKey,
      name: 'Rotate Me',
      maskedPreview: '********0000',
      protectedSecretValue: 'local:v1:old',
      protectionProvider: 'local_aes_256_gcm',
    });

    const rotatedAt = new Date('2026-04-26T12:30:00.000Z');
    const rotated = await repository.rotateByTenantAndId(tenantA, created.id, {
      maskedPreview: '********1111',
      protectedSecretValue: 'local:v1:new',
      protectionProvider: 'local_aes_256_gcm',
      rotatedAt,
      status: CredentialStatus.Active,
      updatedBy: 'dev-actor-002',
    });

    expect(rotated?.maskedPreview).toBe('********1111');
    expect(rotated?.status).toBe(CredentialStatus.Active);
    expect(rotated?.rotatedAt?.getTime()).toBe(rotatedAt.getTime());
    expect(rotated?.updatedBy).toBe('dev-actor-002');
    expect(rotated?.name).toBe('Rotate Me'); // unchanged
    expect(rotated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    // The rotated secret is never exposed.
    expect(JSON.stringify(rotated)).not.toContain('local:v1:new');

    // Unknown id returns null.
    expect(
      await repository.rotateByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        maskedPreview: null,
        protectedSecretValue: 'local:v1:x',
        protectionProvider: 'local_aes_256_gcm',
        rotatedAt: new Date(),
        status: CredentialStatus.Active,
      }),
    ).toBeNull();
    // Non-UUID ids return null.
    expect(
      await repository.rotateByTenantAndId('not-a-uuid', created.id, {
        maskedPreview: null,
        protectedSecretValue: 'local:v1:x',
        protectionProvider: 'local_aes_256_gcm',
        rotatedAt: new Date(),
        status: CredentialStatus.Active,
      }),
    ).toBeNull();
  });

  it('revokes a credential and stays tenant-scoped', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      type: CredentialType.ApiKey,
      name: 'Revoke Me',
      maskedPreview: null,
      protectedSecretValue: 'local:v1:rev',
      protectionProvider: 'local_aes_256_gcm',
    });

    const revokedAt = new Date('2026-04-26T13:00:00.000Z');
    const revoked = await repository.revokeByTenantAndId(tenantA, created.id, {
      status: CredentialStatus.Revoked,
      revokedAt,
      updatedBy: 'dev-actor-003',
    });

    expect(revoked?.status).toBe(CredentialStatus.Revoked);
    expect(revoked?.revokedAt?.getTime()).toBe(revokedAt.getTime());
    expect(revoked?.updatedBy).toBe('dev-actor-003');
    expect(revoked?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    expect(
      await repository.revokeByTenantAndId(tenantA, '00000000-0000-0000-0000-000000000000', {
        status: CredentialStatus.Revoked,
        revokedAt: new Date(),
      }),
    ).toBeNull();
  });

  it('does not rotate or revoke a row owned by another tenant (tenant isolation)', async () => {
    const created = await repository.create({
      tenantId: tenantA,
      type: CredentialType.ApiKey,
      name: 'Owned By A',
      maskedPreview: '********aaaa',
      protectedSecretValue: 'local:v1:owned',
      protectionProvider: 'local_aes_256_gcm',
    });

    // Tenant B must not be able to rotate tenant A's credential.
    const crossRotate = await repository.rotateByTenantAndId(tenantB, created.id, {
      maskedPreview: '********bbbb',
      protectedSecretValue: 'local:v1:hijacked',
      protectionProvider: 'local_aes_256_gcm',
      rotatedAt: new Date(),
      status: CredentialStatus.Active,
    });
    expect(crossRotate).toBeNull();

    // Tenant B must not be able to revoke tenant A's credential.
    const crossRevoke = await repository.revokeByTenantAndId(tenantB, created.id, {
      status: CredentialStatus.Revoked,
      revokedAt: new Date(),
    });
    expect(crossRevoke).toBeNull();

    // The row is untouched and still owned by tenant A.
    const reread = await repository.findByTenantAndId(tenantA, created.id);
    expect(reread?.maskedPreview).toBe('********aaaa');
    expect(reread?.status).toBe(CredentialStatus.Active);
    expect(reread?.tenantId).toBe(tenantA);
  });
});
