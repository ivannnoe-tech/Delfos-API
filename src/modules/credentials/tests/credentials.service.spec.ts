import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { CredentialsRepository } from '../repositories/credentials.repository';
import { CredentialDocument, CredentialStatus, CredentialType } from '../schemas/credential.schema';
import { CredentialsService } from '../services/credentials.service';
import { LocalCredentialProtectorService } from '../services/local-credential-protector.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('CredentialsService', () => {
  it('creates a credential reference without exposing the secret and audits safe metadata', async () => {
    const credentialId = new Types.ObjectId();
    const tenantId = new Types.ObjectId();
    const connectionId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<CredentialsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createCredentialDocument({
          _id: credentialId,
          tenantId: record.tenantId,
          connectionId: record.connectionId,
          type: record.type,
          provider: record.provider,
          name: record.name,
          status: record.status ?? CredentialStatus.Active,
          maskedPreview: record.maskedPreview,
          protectedSecretValue: record.protectedSecretValue,
          protectionProvider: record.protectionProvider,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = new CredentialsService(
      repository as CredentialsRepository,
      createProtector(),
      auditService as unknown as AuditService,
    );

    const result = await service.create(
      {
        tenantId: tenantId.toString(),
        connectionId: connectionId.toString(),
        type: CredentialType.ApiKey,
        provider: 'customer-api',
        name: 'Primary credential',
        secretValue: 'very-sensitive-secret-1234',
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        connectionId,
        maskedPreview: '********1234',
        protectedSecretValue: 'protected-value',
        createdBy: 'dev-actor-001',
      }),
    );
    expect(result).toMatchObject({
      id: credentialId.toString(),
      credentialRef: `cred_${credentialId.toString()}`,
      tenantId: tenantId.toString(),
      connectionId: connectionId.toString(),
      maskedPreview: '********1234',
    });
    expect(JSON.stringify(result)).not.toContain('very-sensitive-secret-1234');
    expect(JSON.stringify(result)).not.toContain('protected-value');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: tenantId.toString(),
      actorUserId: undefined,
      action: 'credential.created',
      entity: 'credential',
      entityId: credentialId.toString(),
      metadata: {
        type: CredentialType.ApiKey,
        status: CredentialStatus.Active,
        provider: 'customer-api',
        connectionId: connectionId.toString(),
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain(
      'very-sensitive-secret-1234',
    );
  });

  it('lists credential metadata without protected values', async () => {
    const tenantId = new Types.ObjectId();
    const credentialId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<CredentialsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createCredentialDocument({
          _id: credentialId,
          tenantId,
          type: CredentialType.BearerToken,
          name: 'Bearer credential',
          status: CredentialStatus.Active,
          maskedPreview: '********1234',
          protectedSecretValue: 'protected-value',
          protectionProvider: 'local_aes_256_gcm',
          createdAt,
          updatedAt: createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = new CredentialsService(
      repository as CredentialsRepository,
      createProtector(),
      createAuditService() as unknown as AuditService,
    );

    const result = await service.findByFilters({
      tenantId: tenantId.toString(),
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith({ tenantId }, 1, 25);
    expect(result.items).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('protected-value');
  });

  it('gets one credential using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const credentialId = new Types.ObjectId();
    const repository: Pick<CredentialsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = new CredentialsService(
      repository as CredentialsRepository,
      createProtector(),
      createAuditService() as unknown as AuditService,
    );

    await expect(
      service.findOne(tenantId.toString(), credentialId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(tenantId, credentialId.toString());
  });

  it('rotates a credential without exposing the new secret', async () => {
    const tenantId = new Types.ObjectId();
    const credentialId = new Types.ObjectId();
    const rotatedAt = new Date('2026-04-26T12:30:00.000Z');
    const repository: Pick<CredentialsRepository, 'rotateByTenantAndId'> = {
      rotateByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        createCredentialDocument({
          _id: credentialId,
          tenantId,
          type: CredentialType.ApiKey,
          name: 'Primary credential',
          status: record.status,
          maskedPreview: record.maskedPreview,
          protectedSecretValue: record.protectedSecretValue,
          protectionProvider: record.protectionProvider,
          rotatedAt,
          createdAt: rotatedAt,
          updatedAt: rotatedAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = new CredentialsService(
      repository as CredentialsRepository,
      createProtector(),
      auditService as unknown as AuditService,
    );

    const result = await service.rotate(
      tenantId.toString(),
      credentialId.toString(),
      { secretValue: 'rotated-sensitive-secret-1234' },
      {},
    );

    expect(repository.rotateByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      credentialId.toString(),
      expect.objectContaining({
        status: CredentialStatus.Active,
        protectedSecretValue: 'protected-value',
        maskedPreview: '********1234',
      }),
    );
    expect(result.rotatedAt).toBe(rotatedAt.toISOString());
    expect(JSON.stringify(result)).not.toContain('rotated-sensitive-secret-1234');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.rotated' }),
    );
  });

  it('revokes a credential and records audit', async () => {
    const tenantId = new Types.ObjectId();
    const credentialId = new Types.ObjectId();
    const revokedAt = new Date('2026-04-26T13:00:00.000Z');
    const repository: Pick<CredentialsRepository, 'revokeByTenantAndId'> = {
      revokeByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        createCredentialDocument({
          _id: credentialId,
          tenantId,
          type: CredentialType.ApiKey,
          name: 'Primary credential',
          status: record.status,
          maskedPreview: '********1234',
          protectedSecretValue: 'protected-value',
          protectionProvider: 'local_aes_256_gcm',
          revokedAt,
          createdAt: revokedAt,
          updatedAt: revokedAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = new CredentialsService(
      repository as CredentialsRepository,
      createProtector(),
      auditService as unknown as AuditService,
    );

    const result = await service.revoke(tenantId.toString(), credentialId.toString());

    expect(repository.revokeByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      credentialId.toString(),
      expect.objectContaining({ status: CredentialStatus.Revoked }),
    );
    expect(result.status).toBe(CredentialStatus.Revoked);
    expect(result.revokedAt).toBe(revokedAt.toISOString());
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.revoked' }),
    );
  });
});

function createProtector(): LocalCredentialProtectorService {
  return {
    protect: jest.fn(() => ({
      protectedValue: 'protected-value',
      provider: 'local_aes_256_gcm',
      maskedPreview: '********1234',
    })),
  } as unknown as LocalCredentialProtectorService;
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: new Types.ObjectId().toString(),
      tenantId: new Types.ObjectId().toString(),
      action: 'credential.created',
      entity: 'credential',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createCredentialDocument(record: Partial<CredentialDocument>): CredentialDocument {
  return record as CredentialDocument;
}
