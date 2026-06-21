import { NotFoundException } from '@nestjs/common';

import { UserRecord, UsersRepository } from '../repositories/users.repository';
import { UserRole, UserStatus } from '../schemas/user.constants';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  it('scopes updates by tenant id', async () => {
    const repository: Pick<UsersRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async () => null),
    };
    const service = new UsersService(repository as UsersRepository);
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const userId = '662d4f6e7a1c2b00124f0101';

    await expect(service.update(tenantId, userId, { name: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(tenantId, userId, {
      name: 'Updated',
    });
  });

  it('maps a neutral user record to the response DTO', async () => {
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const record: UserRecord = {
      id: '662d4f6e7a1c2b00124f0101',
      tenantId: '662d4f6e7a1c2b00124f0001',
      name: 'Delfos Operator',
      email: 'operator@example.com',
      role: UserRole.Operator,
      status: UserStatus.Active,
      createdAt,
      updatedAt: createdAt,
    };
    const repository: Pick<UsersRepository, 'create'> = {
      create: jest.fn(async () => record),
    };
    const service = new UsersService(repository as UsersRepository);

    const result = await service.create({
      tenantId: '662d4f6e7a1c2b00124f0001',
      name: 'Delfos Operator',
      email: 'operator@example.com',
    });

    expect(repository.create).toHaveBeenCalledWith({
      tenantId: '662d4f6e7a1c2b00124f0001',
      name: 'Delfos Operator',
      email: 'operator@example.com',
      role: undefined,
      status: undefined,
    });
    expect(result).toEqual({
      id: '662d4f6e7a1c2b00124f0101',
      tenantId: '662d4f6e7a1c2b00124f0001',
      name: 'Delfos Operator',
      email: 'operator@example.com',
      role: UserRole.Operator,
      status: UserStatus.Active,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });
});
