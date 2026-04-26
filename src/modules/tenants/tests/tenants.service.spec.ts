import { Types } from 'mongoose';

import { TenantsRepository } from '../repositories/tenants.repository';
import { TenantDocument, TenantStatus } from '../schemas/tenant.schema';
import { TenantsService } from '../services/tenants.service';

describe('TenantsService', () => {
  it('creates a tenant with sanitized settings', async () => {
    const tenantId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<TenantsRepository, 'create'> = {
      create: jest.fn(
        async (record) =>
          ({
            _id: tenantId,
            name: record.name,
            slug: record.slug,
            status: record.status ?? TenantStatus.Active,
            settings: record.settings,
            createdAt,
            updatedAt: createdAt,
          }) as unknown as TenantDocument,
      ),
    };
    const service = new TenantsService(repository as TenantsRepository);

    const result = await service.create({
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      settings: { onboardingStage: 'foundation', token: 'secret' },
    });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      status: undefined,
      settings: { onboardingStage: 'foundation' },
    });
    expect(result).toEqual({
      id: tenantId.toString(),
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      status: TenantStatus.Active,
      settings: { onboardingStage: 'foundation' },
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });
});
