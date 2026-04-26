import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserDocument } from '../schemas/user.schema';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.create({
      tenantId: new Types.ObjectId(dto.tenantId),
      name: dto.name,
      email: dto.email,
      role: dto.role,
      status: dto.status,
    });

    return this.toResponse(user);
  }

  async findByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ListResponse<UserResponseDto>> {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const [items, total] = await Promise.all([
      this.usersRepository.findByTenant(tenantObjectId, page, pageSize),
      this.usersRepository.countByTenant(tenantObjectId),
    ]);

    return {
      items: items.map((user) => this.toResponse(user)),
      meta: buildListMeta(page, pageSize, total),
    };
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.updateByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      dto,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toResponse(user);
  }

  private toResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
