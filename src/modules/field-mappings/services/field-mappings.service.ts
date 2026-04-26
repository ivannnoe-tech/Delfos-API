import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { AuditService } from '../../audit/services/audit.service';
import { CreateFieldMappingDto } from '../dto/create-field-mapping.dto';
import { FieldMappingResponseDto } from '../dto/field-mapping-response.dto';
import { ListFieldMappingsQueryDto } from '../dto/field-mapping-query.dto';
import { UpdateFieldMappingDto } from '../dto/update-field-mapping.dto';
import { FieldMappingsRepository } from '../repositories/field-mappings.repository';
import { FieldMappingDocument } from '../schemas/field-mapping.schema';

@Injectable()
export class FieldMappingsService {
  constructor(
    private readonly fieldMappingsRepository: FieldMappingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateFieldMappingDto,
    actor: { actorId?: string } = {},
  ): Promise<FieldMappingResponseDto> {
    const fieldMapping = await this.fieldMappingsRepository.create({
      tenantId: new Types.ObjectId(dto.tenantId),
      connectionId: dto.connectionId ? new Types.ObjectId(dto.connectionId) : undefined,
      datasetKey: dto.datasetKey,
      sourcePath: dto.sourcePath,
      targetField: dto.targetField,
      targetType: dto.targetType,
      required: dto.required,
      transform: dto.transform,
      status: dto.status,
    });

    await this.recordAudit('field_mapping.created', fieldMapping, actor);

    return this.toResponse(fieldMapping);
  }

  async findByFilters(
    query: ListFieldMappingsQueryDto,
  ): Promise<ListResponse<FieldMappingResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      datasetKey: query.datasetKey,
      connectionId: query.connectionId ? new Types.ObjectId(query.connectionId) : undefined,
    };
    const [items, total] = await Promise.all([
      this.fieldMappingsRepository.findByFilters(filters, query.page, query.pageSize),
      this.fieldMappingsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((fieldMapping) => this.toResponse(fieldMapping)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateFieldMappingDto,
    actor: { actorId?: string } = {},
  ): Promise<FieldMappingResponseDto> {
    const fieldMapping = await this.fieldMappingsRepository.updateByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      {
        ...dto,
        connectionId: dto.connectionId ? new Types.ObjectId(dto.connectionId) : undefined,
      },
    );

    if (!fieldMapping) {
      throw new NotFoundException('Field mapping not found.');
    }

    await this.recordAudit('field_mapping.updated', fieldMapping, actor);

    return this.toResponse(fieldMapping);
  }

  async deactivate(
    tenantId: string,
    id: string,
    actor: { actorId?: string } = {},
  ): Promise<FieldMappingResponseDto> {
    const fieldMapping = await this.fieldMappingsRepository.deactivateByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

    if (!fieldMapping) {
      throw new NotFoundException('Field mapping not found.');
    }

    await this.recordAudit('field_mapping.deactivated', fieldMapping, actor);

    return this.toResponse(fieldMapping);
  }

  private async recordAudit(
    action: string,
    fieldMapping: FieldMappingDocument,
    actor: { actorId?: string },
  ): Promise<void> {
    await this.auditService.record({
      tenantId: fieldMapping.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'field_mapping',
      entityId: fieldMapping._id.toString(),
      metadata: {
        datasetKey: fieldMapping.datasetKey,
        targetField: fieldMapping.targetField,
        targetType: fieldMapping.targetType,
        status: fieldMapping.status,
        connectionId: fieldMapping.connectionId?.toString() ?? null,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(fieldMapping: FieldMappingDocument): FieldMappingResponseDto {
    return {
      id: fieldMapping._id.toString(),
      tenantId: fieldMapping.tenantId.toString(),
      connectionId: fieldMapping.connectionId?.toString(),
      datasetKey: fieldMapping.datasetKey,
      sourcePath: fieldMapping.sourcePath,
      targetField: fieldMapping.targetField,
      targetType: fieldMapping.targetType,
      required: fieldMapping.required,
      transform: fieldMapping.transform,
      status: fieldMapping.status,
      createdAt: fieldMapping.createdAt.toISOString(),
      updatedAt: fieldMapping.updatedAt.toISOString(),
    };
  }
}
