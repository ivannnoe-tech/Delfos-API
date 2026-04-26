import { Types } from 'mongoose';

import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { AuditLogDocument } from '../schemas/audit-log.schema';
import { AuditService } from '../services/audit.service';

describe('AuditService', () => {
  it('records audit metadata without sensitive values', async () => {
    const auditId = new Types.ObjectId();
    const tenantId = new Types.ObjectId();
    const timestamp = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<AuditLogsRepository, 'create'> = {
      create: jest.fn(
        async (record) =>
          ({
            _id: auditId,
            tenantId: record.tenantId,
            actorUserId: record.actorUserId,
            action: record.action,
            entity: record.entity,
            entityId: record.entityId,
            metadata: record.metadata,
            timestamp,
          }) as unknown as AuditLogDocument,
      ),
    };
    const service = new AuditService(repository as AuditLogsRepository);

    const result = await service.record({
      tenantId: tenantId.toString(),
      action: 'connection.created',
      entity: 'connection',
      metadata: { status: 'draft', secret: 'must-not-leak' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { status: 'draft' },
      }),
    );
    expect(result.metadata).toEqual({ status: 'draft' });
  });
});
