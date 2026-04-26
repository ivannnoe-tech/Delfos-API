import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  it('scopes updates by tenant id', async () => {
    const repository: Pick<UsersRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async () => null),
    };
    const service = new UsersService(repository as UsersRepository);
    const tenantId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    await expect(service.update(tenantId, userId, { name: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(
      new Types.ObjectId(tenantId),
      userId,
      { name: 'Updated' },
    );
  });
});
