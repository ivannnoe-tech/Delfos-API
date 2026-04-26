import { Types } from 'mongoose';

import { FieldMappingsRepository } from '../repositories/field-mappings.repository';
import {
  FieldMappingDocument,
  FieldMappingStatus,
  FieldMappingTargetType,
} from '../schemas/field-mapping.schema';
import { FieldMappingsService } from '../services/field-mappings.service';

describe('FieldMappingsService', () => {
  it('deactivates mappings using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const mappingId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<FieldMappingsRepository, 'deactivateByTenantAndId'> = {
      deactivateByTenantAndId: jest.fn(
        async () =>
          ({
            _id: mappingId,
            tenantId,
            datasetKey: 'sales',
            sourcePath: 'order.total',
            targetField: 'totalAmount',
            targetType: FieldMappingTargetType.Money,
            required: true,
            status: FieldMappingStatus.Inactive,
            createdAt,
            updatedAt: createdAt,
          }) as unknown as FieldMappingDocument,
      ),
    };
    const service = new FieldMappingsService(repository as FieldMappingsRepository);

    const result = await service.deactivate(tenantId.toString(), mappingId.toString());

    expect(repository.deactivateByTenantAndId).toHaveBeenCalledWith(tenantId, mappingId.toString());
    expect(result.status).toBe(FieldMappingStatus.Inactive);
  });
});
