import { AuditLogRecord, AuditLogsRepository } from '../repositories/audit-logs.repository';
import { AuditService } from '../services/audit.service';

describe('AuditService', () => {
  it('records audit metadata without sensitive values', async () => {
    const timestamp = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<AuditLogsRepository, 'create'> = {
      create: jest.fn(
        async (record): Promise<AuditLogRecord> => ({
          id: '662d4f6e7a1c2b00124f0001',
          tenantId: record.tenantId,
          actorUserId: record.actorUserId,
          action: record.action,
          entity: record.entity,
          entityId: record.entityId,
          metadata: record.metadata,
          timestamp,
        }),
      ),
    };
    const service = new AuditService(repository);

    const result = await service.record({
      tenantId: '662d4f6e7a1c2b00124f00aa',
      action: 'connection.created',
      entity: 'connection',
      metadata: { status: 'draft', secret: 'must-not-leak' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: '662d4f6e7a1c2b00124f00aa',
        metadata: { status: 'draft' },
      }),
    );
    expect(result.metadata).toEqual({ status: 'draft' });
    expect(result.timestamp).toBe(timestamp.toISOString());
  });
});
