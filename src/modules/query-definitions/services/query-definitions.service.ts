import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateQueryDefinitionDto } from '../dto/create-query-definition.dto';
import {
  ListQueryDefinitionsQueryDto,
  QueryDefinitionTenantQueryDto,
} from '../dto/query-definition-query.dto';
import {
  QueryDefinitionDimensionResponseDto,
  QueryDefinitionFilterResponseDto,
  QueryDefinitionMetricResponseDto,
  QueryDefinitionResponseDto,
  QueryDefinitionSortResponseDto,
} from '../dto/query-definition-response.dto';
import { UpdateQueryDefinitionDto } from '../dto/update-query-definition.dto';
import {
  QueryDefinitionRecord,
  QueryDefinitionsRepository,
  UpdateQueryDefinitionRecord,
} from '../repositories/query-definitions.repository';
import {
  QueryDefinitionDimension,
  QueryDefinitionFilter,
  QueryDefinitionMetric,
  QueryDefinitionSort,
} from '../schemas/query-definition.constants';
import { QueryDefinitionSanitizerService } from './query-definition-sanitizer.service';

export interface QueryDefinitionActorContext {
  actorId?: string;
}

@Injectable()
export class QueryDefinitionsService {
  constructor(
    private readonly queryDefinitionsRepository: QueryDefinitionsRepository,
    private readonly queryDefinitionSanitizer: QueryDefinitionSanitizerService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateQueryDefinitionDto,
    actor: QueryDefinitionActorContext = {},
  ): Promise<QueryDefinitionResponseDto> {
    try {
      const queryDefinition = await this.queryDefinitionsRepository.create({
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        queryKey: dto.queryKey,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        type: dto.type,
        metrics: this.queryDefinitionSanitizer.sanitizeMetrics(dto.metrics),
        dimensions: this.queryDefinitionSanitizer.sanitizeDimensions(dto.dimensions),
        filters: this.queryDefinitionSanitizer.sanitizeFilters(dto.filters),
        sorts: this.queryDefinitionSanitizer.sanitizeSorts(dto.sorts),
        defaultLimit: dto.defaultLimit,
        timeField: dto.timeField,
        allowedGranularities: dto.allowedGranularities ?? [],
        tags: dto.tags ?? [],
        metadata: sanitizeMetadata(dto.metadata),
        settings: sanitizeMetadata(dto.settings),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      });

      await this.recordAudit('query_definition.created', queryDefinition, actor);

      return this.toResponse(queryDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findByFilters(
    query: ListQueryDefinitionsQueryDto,
  ): Promise<ListResponse<QueryDefinitionResponseDto>> {
    const filters = {
      tenantId: query.tenantId,
      datasetId: query.datasetId,
      queryKey: query.queryKey,
      status: query.status,
      type: query.type,
    };
    const [items, total] = await Promise.all([
      this.queryDefinitionsRepository.findByFilters(filters, query.page, query.pageSize),
      this.queryDefinitionsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((queryDefinition) => this.toResponse(queryDefinition)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(
    tenantId: QueryDefinitionTenantQueryDto['tenantId'],
    id: string,
  ): Promise<QueryDefinitionResponseDto> {
    const queryDefinition = await this.queryDefinitionsRepository.findByTenantAndId(tenantId, id);

    if (!queryDefinition) {
      throw new NotFoundException('Query definition not found.');
    }

    return this.toResponse(queryDefinition);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateQueryDefinitionDto,
    actor: QueryDefinitionActorContext = {},
  ): Promise<QueryDefinitionResponseDto> {
    try {
      const queryDefinition = await this.queryDefinitionsRepository.updateByTenantAndId(
        tenantId,
        id,
        this.toUpdateRecord(dto, actor),
      );

      if (!queryDefinition) {
        throw new NotFoundException('Query definition not found.');
      }

      await this.recordAudit('query_definition.updated', queryDefinition, actor);

      return this.toResponse(queryDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async archive(
    tenantId: string,
    id: string,
    actor: QueryDefinitionActorContext = {},
  ): Promise<QueryDefinitionResponseDto> {
    const queryDefinition = await this.queryDefinitionsRepository.archiveByTenantAndId(
      tenantId,
      id,
      actor.actorId,
    );

    if (!queryDefinition) {
      throw new NotFoundException('Query definition not found.');
    }

    await this.recordAudit('query_definition.archived', queryDefinition, actor);

    return this.toResponse(queryDefinition);
  }

  private toUpdateRecord(
    dto: UpdateQueryDefinitionDto,
    actor: QueryDefinitionActorContext,
  ): UpdateQueryDefinitionRecord {
    return {
      ...(dto.datasetId !== undefined ? { datasetId: dto.datasetId } : {}),
      ...(dto.queryKey !== undefined ? { queryKey: dto.queryKey } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.metrics !== undefined
        ? { metrics: this.queryDefinitionSanitizer.sanitizeMetrics(dto.metrics) }
        : {}),
      ...(dto.dimensions !== undefined
        ? { dimensions: this.queryDefinitionSanitizer.sanitizeDimensions(dto.dimensions) }
        : {}),
      ...(dto.filters !== undefined
        ? { filters: this.queryDefinitionSanitizer.sanitizeFilters(dto.filters) }
        : {}),
      ...(dto.sorts !== undefined
        ? { sorts: this.queryDefinitionSanitizer.sanitizeSorts(dto.sorts) }
        : {}),
      ...(dto.defaultLimit !== undefined ? { defaultLimit: dto.defaultLimit } : {}),
      ...(dto.timeField !== undefined ? { timeField: dto.timeField } : {}),
      ...(dto.allowedGranularities !== undefined
        ? { allowedGranularities: dto.allowedGranularities }
        : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.metadata !== undefined ? { metadata: sanitizeMetadata(dto.metadata) } : {}),
      ...(dto.settings !== undefined ? { settings: sanitizeMetadata(dto.settings) } : {}),
      updatedBy: actor.actorId,
    };
  }

  private async recordAudit(
    action: string,
    queryDefinition: QueryDefinitionRecord,
    actor: QueryDefinitionActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: queryDefinition.tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'query_definition',
      entityId: queryDefinition.id,
      metadata: {
        queryKey: queryDefinition.queryKey,
        status: queryDefinition.status,
        type: queryDefinition.type,
        datasetId: queryDefinition.datasetId,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(queryDefinition: QueryDefinitionRecord): QueryDefinitionResponseDto {
    return {
      id: queryDefinition.id,
      tenantId: queryDefinition.tenantId,
      datasetId: queryDefinition.datasetId,
      queryKey: queryDefinition.queryKey,
      name: queryDefinition.name,
      description: queryDefinition.description,
      status: queryDefinition.status,
      type: queryDefinition.type,
      metrics: queryDefinition.metrics.map((metric) => this.toMetricResponse(metric)),
      dimensions: queryDefinition.dimensions.map((dimension) =>
        this.toDimensionResponse(dimension),
      ),
      filters: queryDefinition.filters.map((filter) => this.toFilterResponse(filter)),
      sorts: queryDefinition.sorts.map((sort) => this.toSortResponse(sort)),
      defaultLimit: queryDefinition.defaultLimit,
      timeField: queryDefinition.timeField,
      allowedGranularities: queryDefinition.allowedGranularities,
      tags: queryDefinition.tags,
      metadata: queryDefinition.metadata,
      settings: queryDefinition.settings,
      createdAt: queryDefinition.createdAt.toISOString(),
      updatedAt: queryDefinition.updatedAt.toISOString(),
      createdBy: queryDefinition.createdBy,
      updatedBy: queryDefinition.updatedBy,
    };
  }

  private toMetricResponse(metric: QueryDefinitionMetric): QueryDefinitionMetricResponseDto {
    return {
      key: metric.key,
      label: metric.label,
      field: metric.field,
      aggregation: metric.aggregation,
      format: metric.format,
      description: metric.description,
    };
  }

  private toDimensionResponse(
    dimension: QueryDefinitionDimension,
  ): QueryDefinitionDimensionResponseDto {
    return {
      key: dimension.key,
      label: dimension.label,
      field: dimension.field,
      type: dimension.type,
      description: dimension.description,
    };
  }

  private toFilterResponse(filter: QueryDefinitionFilter): QueryDefinitionFilterResponseDto {
    return {
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required,
      defaultValue: filter.defaultValue,
      allowedValues: filter.allowedValues,
    };
  }

  private toSortResponse(sort: QueryDefinitionSort): QueryDefinitionSortResponseDto {
    return {
      field: sort.field,
      direction: sort.direction,
    };
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException('Query key already exists for tenant.');
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
