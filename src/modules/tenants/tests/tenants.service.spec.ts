import { TenantRecord, TenantsRepository } from '../repositories/tenants.repository';
import { TenantStatus } from '../schemas/tenant.constants';
import { TenantsService } from '../services/tenants.service';

describe('TenantsService', () => {
  it('creates a tenant with sanitized settings', async () => {
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const record: TenantRecord = {
      id: '662d4f6e7a1c2b00124f0001',
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      status: TenantStatus.Active,
      settings: { onboardingStage: 'foundation' },
      createdAt,
      updatedAt: createdAt,
    };
    const repository: Pick<TenantsRepository, 'create'> = {
      create: jest.fn(async () => record),
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
      id: '662d4f6e7a1c2b00124f0001',
      name: 'Acme Analytics',
      slug: 'acme-analytics',
      status: TenantStatus.Active,
      settings: { onboardingStage: 'foundation' },
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });
});
