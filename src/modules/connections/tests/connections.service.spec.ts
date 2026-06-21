import { randomUUID } from 'node:crypto';

import { AuditService } from '../../audit/services/audit.service';
import { ConnectionRecord, ConnectionsRepository } from '../repositories/connections.repository';
import {
  ConnectionAuthType,
  ConnectionStatus,
  ConnectionType,
} from '../schemas/connection.constants';
import { ConnectionsService } from '../services/connections.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('ConnectionsService', () => {
  it('stores sanitized metadata, hides credential references, and audits safe context', async () => {
    const connectionId = '662d4f6e7a1c2b00124f0501';
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<ConnectionsRepository, 'create'> = {
      create: jest.fn(
        async (record): Promise<ConnectionRecord> => ({
          id: connectionId,
          tenantId: record.tenantId,
          name: record.name,
          type: record.type ?? ConnectionType.CustomerApi,
          baseUrl: record.baseUrl,
          authType: record.authType ?? ConnectionAuthType.None,
          credentialRef: record.credentialRef,
          allowedHeaders: record.allowedHeaders,
          metadata: record.metadata,
          status: record.status ?? ConnectionStatus.Draft,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = new ConnectionsService(
      repository as ConnectionsRepository,
      auditService as unknown as AuditService,
    );

    const result = await service.create(
      {
        tenantId,
        name: 'Primary customer API',
        baseUrl: 'https://api.customer.example',
        authType: ConnectionAuthType.BearerToken,
        credentialRef: 'vault-reference',
        metadata: { environment: 'sandbox', accessToken: 'must-not-leak' },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialRef: 'vault-reference',
        metadata: { environment: 'sandbox' },
      }),
    );
    expect(result.hasCredentialReference).toBe(true);
    expect(result).not.toHaveProperty('credentialRef');
    expect(result.metadata).toEqual({ environment: 'sandbox' });
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId,
      actorUserId: undefined,
      action: 'connection.created',
      entity: 'connection',
      entityId: connectionId,
      metadata: {
        type: ConnectionType.CustomerApi,
        authType: ConnectionAuthType.BearerToken,
        status: ConnectionStatus.Draft,
        hasCredentialReference: true,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('vault-reference');
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });
});

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: randomUUID(),
      tenantId: randomUUID(),
      action: 'connection.created',
      entity: 'connection',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}
