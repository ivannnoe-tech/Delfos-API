import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { DatasetFieldResponseDto, DatasetResponseDto } from '../dto/dataset-response.dto';
import { ListDatasetsQueryDto } from '../dto/dataset-query.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { DatasetsRepository, UpdateDatasetRecord } from '../repositories/datasets.repository';
import { DatasetDocument } from '../schemas/dataset.schema';
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
        tenantId: new Types.ObjectId(dto.tenantId),
        connectionId: dto.connectionId ? new Types.ObjectId(dto.connectionId) : undefined,
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
      tenantId: new Types.ObjectId(query.tenantId),
      connectionId: query.connectionId ? new Types.ObjectId(query.connectionId) : undefined,
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
    const dataset = await this.datasetsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

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
      const dataset = await this.datasetsRepository.updateByTenantAndId(
        new Types.ObjectId(tenantId),
        id,
        record,
      );

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
      ...(dto.connectionId !== undefined
        ? { connectionId: new Types.ObjectId(dto.connectionId) }
        : {}),
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
    const dataset = await this.datasetsRepository.archiveByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      actor.actorId,
    );

    if (!dataset) {
      throw new NotFoundException('Dataset not found.');
    }

    await this.recordAudit('dataset.archived', dataset, actor);

    return this.toResponse(dataset);
  }

  private async recordAudit(
    action: string,
    dataset: DatasetDocument,
    actor: DatasetActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: dataset.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'dataset',
      entityId: dataset._id.toString(),
      metadata: {
        datasetKey: dataset.datasetKey,
        status: dataset.status,
        sourceType: dataset.sourceType,
        connectionId: dataset.connectionId?.toString() ?? null,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(dataset: DatasetDocument): DatasetResponseDto {
    return {
      id: dataset._id.toString(),
      tenantId: dataset.tenantId.toString(),
      connectionId: dataset.connectionId?.toString(),
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

  private toFieldResponse(field: DatasetDocument['fields'][number]): DatasetFieldResponseDto {
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
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }
}
