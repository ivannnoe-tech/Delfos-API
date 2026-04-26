import { Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantDocument } from '../schemas/tenant.schema';
import { TenantsRepository } from '../repositories/tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.tenantsRepository.create({
      name: dto.name,
      slug: dto.slug,
      status: dto.status,
      settings: sanitizeMetadata(dto.settings),
    });

    return this.toResponse(tenant);
  }

  async findAll(page: number, pageSize: number): Promise<ListResponse<TenantResponseDto>> {
    const [items, total] = await Promise.all([
      this.tenantsRepository.findAll(page, pageSize),
      this.tenantsRepository.countAll(),
    ]);

    return {
      items: items.map((tenant) => this.toResponse(tenant)),
      meta: buildListMeta(page, pageSize, total),
    };
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantsRepository.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return this.toResponse(tenant);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.tenantsRepository.updateById(id, {
      ...dto,
      settings: dto.settings ? sanitizeMetadata(dto.settings) : undefined,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return this.toResponse(tenant);
  }

  private toResponse(tenant: TenantDocument): TenantResponseDto {
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      settings: tenant.settings,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }
}
