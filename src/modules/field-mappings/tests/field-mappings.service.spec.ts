import { randomUUID } from 'node:crypto';

import { AuditService } from '../../audit/services/audit.service';
import {
  FieldMappingRecord,
  FieldMappingsRepository,
} from '../repositories/field-mappings.repository';
import { FieldMappingStatus, FieldMappingTargetType } from '../schemas/field-mapping.constants';
import { FieldMappingsService } from '../services/field-mappings.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('FieldMappingsService', () => {
  it('deactivates mappings using tenant scoped lookup and safe audit metadata', async () => {
    const tenantId = randomUUID();
    const mappingId = randomUUID();
    const connectionId = randomUUID();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const record: FieldMappingRecord = {
      id: mappingId,
      tenantId,
      connectionId,
      datasetKey: 'sales',
      sourcePath: 'order.total',
      targetField: 'totalAmount',
      targetType: FieldMappingTargetType.Money,
      required: true,
      status: FieldMappingStatus.Inactive,
      createdAt,
      updatedAt: createdAt,
    };
    const repository: Pick<FieldMappingsRepository, 'deactivateByTenantAndId'> = {
      deactivateByTenantAndId: jest.fn(async () => record),
    };
    const auditService = createAuditService();
    const service = new FieldMappingsService(
      repository as FieldMappingsRepository,
      auditService as unknown as AuditService,
    );

    const result = await service.deactivate(tenantId, mappingId, {
      actorId: 'dev-actor-001',
    });

    expect(repository.deactivateByTenantAndId).toHaveBeenCalledWith(tenantId, mappingId);
    expect(result.status).toBe(FieldMappingStatus.Inactive);
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId,
      actorUserId: undefined,
      action: 'field_mapping.deactivated',
      entity: 'field_mapping',
      entityId: mappingId,
      metadata: {
        datasetKey: 'sales',
        targetField: 'totalAmount',
        targetType: FieldMappingTargetType.Money,
        status: FieldMappingStatus.Inactive,
        connectionId,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('order.total');
  });
});

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: randomUUID(),
      tenantId: randomUUID(),
      action: 'field_mapping.deactivated',
      entity: 'field_mapping',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}
