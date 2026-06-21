import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { DatasetFieldResponseDto, DatasetResponseDto } from '../dto/dataset-response.dto';
import { ListDatasetsQueryDto } from '../dto/dataset-query.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import {
  DatasetRecord,
  DatasetsRepository,
  UpdateDatasetRecord,
} from '../repositories/datasets.repository';
import { DatasetField } from '../schemas/dataset.constants';
import { DatasetFieldSanitizerService } from './dataset-field-sanitizer.service';

export interface DatasetActorContext {
  actorId?: string;
}

@Injectable()
export class DatasetsService {
  constructor(
    private readonly datasetsRepository: DatasetsRepository,
    private readonly datasetFieldSanitizer: DatasetFieldSanitizerService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateDatasetDto,
    actor: DatasetActorContext = {},
  ): Promise<DatasetResponseDto> {
    try {
      const dataset = await this.datasetsRepository.create({
        tenantId: dto.tenantId,
        connectionId: dto.connectionId,
        datasetKey: dto.datasetKey,
        name: dto.name,
        description: dto.description,
        sourceType: dto.sourceType,
        status: dto.status,
        refreshMode: dto.refreshMode,
        schemaMode: dto.schemaMode,
        fields: this.datasetFieldSanitizer.sanitize(dto.fields),
        primaryKeyFields: dto.primaryKeyFields ?? [],
        timeField: dto.timeField,
        tags: dto.tags ?? [],
        metadata: sanitizeMetadata(dto.metadata),
        settings: sanitizeMetadata(dto.settings),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      });

      await this.recordAudit('dataset.created', dataset, actor);

      return this.toResponse(dataset);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findByFilters(query: ListDatasetsQueryDto): Promise<ListResponse<DatasetResponseDto>> {
    const filters = {
      tenantId: query.tenantId,
      connectionId: query.connectionId,
      datasetKey: query.datasetKey,
      status: query.status,
      sourceType: query.sourceType,
    };
    const [items, total] = await Promise.all([
      this.datasetsRepository.findByFilters(filters, query.page, query.pageSize),
      this.datasetsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((dataset) => this.toResponse(dataset)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(tenantId: string, id: string): Promise<DatasetResponseDto> {
    const dataset = await this.datasetsRepository.findByTenantAndId(tenantId, id);

    if (!dataset) {
      throw new NotFoundException('Dataset not found.');
    }

    return this.toResponse(dataset);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDatasetDto,
    actor: DatasetActorContext = {},
  ): Promise<DatasetResponseDto> {
    try {
      const record = this.toUpdateRecord(dto, actor);
      const dataset = await this.datasetsRepository.updateByTenantAndId(tenantId, id, record);

      if (!dataset) {
        throw new NotFoundException('Dataset not found.');
      }

      await this.recordAudit('dataset.updated', dataset, actor);

      return this.toResponse(dataset);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private toUpdateRecord(dto: UpdateDatasetDto, actor: DatasetActorContext): UpdateDatasetRecord {
    return {
      ...(dto.connectionId !== undefined ? { connectionId: dto.connectionId } : {}),
      ...(dto.datasetKey !== undefined ? { datasetKey: dto.datasetKey } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.sourceType !== undefined ? { sourceType: dto.sourceType } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.refreshMode !== undefined ? { refreshMode: dto.refreshMode } : {}),
      ...(dto.schemaMode !== undefined ? { schemaMode: dto.schemaMode } : {}),
      ...(dto.fields !== undefined
        ? { fields: this.datasetFieldSanitizer.sanitize(dto.fields) }
        : {}),
      ...(dto.primaryKeyFields !== undefined ? { primaryKeyFields: dto.primaryKeyFields } : {}),
      ...(dto.timeField !== undefined ? { timeField: dto.timeField } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.metadata !== undefined ? { metadata: sanitizeMetadata(dto.metadata) } : {}),
      ...(dto.settings !== undefined ? { settings: sanitizeMetadata(dto.settings) } : {}),
      updatedBy: actor.actorId,
    };
  }

  async archive(
    tenantId: string,
    id: string,
    actor: DatasetActorContext = {},
  ): Promise<DatasetResponseDto> {
    const dataset = await this.datasetsRepository.archiveByTenantAndId(tenantId, id, actor.actorId);

    if (!dataset) {
      throw new NotFoundException('Dataset not found.');
    }

    await this.recordAudit('dataset.archived', dataset, actor);

    return this.toResponse(dataset);
  }

  private async recordAudit(
    action: string,
    dataset: DatasetRecord,
    actor: DatasetActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: dataset.tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'dataset',
      entityId: dataset.id,
      metadata: {
        datasetKey: dataset.datasetKey,
        status: dataset.status,
        sourceType: dataset.sourceType,
        connectionId: dataset.connectionId ?? null,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(dataset: DatasetRecord): DatasetResponseDto {
    return {
      id: dataset.id,
      tenantId: dataset.tenantId,
      connectionId: dataset.connectionId,
      datasetKey: dataset.datasetKey,
      name: dataset.name,
      description: dataset.description,
      sourceType: dataset.sourceType,
      status: dataset.status,
      refreshMode: dataset.refreshMode,
      schemaMode: dataset.schemaMode,
      fields: dataset.fields.map((field) => this.toFieldResponse(field)),
      primaryKeyFields: dataset.primaryKeyFields,
      timeField: dataset.timeField,
      tags: dataset.tags,
      metadata: dataset.metadata,
      settings: dataset.settings,
      createdAt: dataset.createdAt.toISOString(),
      updatedAt: dataset.updatedAt.toISOString(),
      createdBy: dataset.createdBy,
      updatedBy: dataset.updatedBy,
    };
  }

  private toFieldResponse(field: DatasetField): DatasetFieldResponseDto {
    return {
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      description: field.description,
      sampleMasked: field.sampleMasked,
      semanticRole: field.semanticRole,
    };
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException('Dataset key already exists for tenant.');
    }

    throw error;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    const code = (error as { code?: unknown }).code;
    // Mongo duplicate-key error code (11000) or PostgreSQL unique_violation (23505).
    return code === 11000 || code === '23505';
  }
}
