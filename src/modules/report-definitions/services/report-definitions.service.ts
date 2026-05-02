import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import {
  ListReportDefinitionsQueryDto,
  ReportDefinitionTenantQueryDto,
} from '../dto/report-definition-query.dto';
import { ReportDefinitionResponseDto } from '../dto/report-definition-response.dto';
import { ReportDefinitionBlockResponseDto } from '../dto/report-definition-block.dto';
import { ReportDefinitionFilterResponseDto } from '../dto/report-definition-filter.dto';
import { ReportDefinitionLayoutResponseDto } from '../dto/report-definition-layout.dto';
import { ReportDefinitionParameterResponseDto } from '../dto/report-definition-parameter.dto';
import { ReportDefinitionSectionResponseDto } from '../dto/report-definition-section.dto';
import { UpdateReportDefinitionDto } from '../dto/update-report-definition.dto';
import {
  ReportDefinitionsRepository,
  UpdateReportDefinitionRecord,
} from '../repositories/report-definitions.repository';
import {
  ReportDefinitionBlock,
  ReportDefinitionDocument,
  ReportDefinitionFilter,
  ReportDefinitionLayout,
  ReportDefinitionParameter,
  ReportDefinitionSection,
} from '../schemas/report-definition.schema';
import { ReportDefinitionSanitizerService } from './report-definition-sanitizer.service';

export interface ReportDefinitionActorContext {
  actorId?: string;
}

@Injectable()
export class ReportDefinitionsService {
  constructor(
    private readonly reportDefinitionsRepository: ReportDefinitionsRepository,
    private readonly reportDefinitionSanitizer: ReportDefinitionSanitizerService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateReportDefinitionDto,
    actor: ReportDefinitionActorContext = {},
  ): Promise<ReportDefinitionResponseDto> {
    try {
      const reportDefinition = await this.reportDefinitionsRepository.create({
        tenantId: new Types.ObjectId(dto.tenantId),
        reportKey: dto.reportKey,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        visibility: dto.visibility,
        queryDefinitionId: dto.queryDefinitionId
          ? new Types.ObjectId(dto.queryDefinitionId)
          : undefined,
        dashboardDefinitionId: dto.dashboardDefinitionId
          ? new Types.ObjectId(dto.dashboardDefinitionId)
          : undefined,
        layout: this.reportDefinitionSanitizer.sanitizeLayout(dto.layout),
        sections: this.reportDefinitionSanitizer.sanitizeSections(dto.sections),
        blocks: this.reportDefinitionSanitizer.sanitizeBlocks(dto.blocks),
        filters: this.reportDefinitionSanitizer.sanitizeFilters(dto.filters),
        parameters: this.reportDefinitionSanitizer.sanitizeParameters(dto.parameters),
        exportOptions: sanitizeMetadata(dto.exportOptions),
        tags: dto.tags ?? [],
        metadata: sanitizeMetadata(dto.metadata),
        settings: sanitizeMetadata(dto.settings),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      });

      await this.recordAudit('report_definition.created', reportDefinition, actor);

      return this.toResponse(reportDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findByFilters(
    query: ListReportDefinitionsQueryDto,
  ): Promise<ListResponse<ReportDefinitionResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      reportKey: query.reportKey,
      status: query.status,
      visibility: query.visibility,
      queryDefinitionId: query.queryDefinitionId
        ? new Types.ObjectId(query.queryDefinitionId)
        : undefined,
      dashboardDefinitionId: query.dashboardDefinitionId
        ? new Types.ObjectId(query.dashboardDefinitionId)
        : undefined,
    };
    const [items, total] = await Promise.all([
      this.reportDefinitionsRepository.findByFilters(filters, query.page, query.pageSize),
      this.reportDefinitionsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((reportDefinition) => this.toResponse(reportDefinition)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(
    tenantId: ReportDefinitionTenantQueryDto['tenantId'],
    id: string,
  ): Promise<ReportDefinitionResponseDto> {
    const reportDefinition = await this.reportDefinitionsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

    if (!reportDefinition) {
      throw new NotFoundException('Report definition not found.');
    }

    return this.toResponse(reportDefinition);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateReportDefinitionDto,
    actor: ReportDefinitionActorContext = {},
  ): Promise<ReportDefinitionResponseDto> {
    try {
      const reportDefinition = await this.reportDefinitionsRepository.updateByTenantAndId(
        new Types.ObjectId(tenantId),
        id,
        this.toUpdateRecord(dto, actor),
      );

      if (!reportDefinition) {
        throw new NotFoundException('Report definition not found.');
      }

      await this.recordAudit('report_definition.updated', reportDefinition, actor);

      return this.toResponse(reportDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async archive(
    tenantId: string,
    id: string,
    actor: ReportDefinitionActorContext = {},
  ): Promise<ReportDefinitionResponseDto> {
    const reportDefinition = await this.reportDefinitionsRepository.archiveByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      actor.actorId,
    );

    if (!reportDefinition) {
      throw new NotFoundException('Report definition not found.');
    }

    await this.recordAudit('report_definition.archived', reportDefinition, actor);

    return this.toResponse(reportDefinition);
  }

  private toUpdateRecord(
    dto: UpdateReportDefinitionDto,
    actor: ReportDefinitionActorContext,
  ): UpdateReportDefinitionRecord {
    return {
      ...(dto.reportKey !== undefined ? { reportKey: dto.reportKey } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      ...(dto.queryDefinitionId !== undefined
        ? { queryDefinitionId: new Types.ObjectId(dto.queryDefinitionId) }
        : {}),
      ...(dto.dashboardDefinitionId !== undefined
        ? { dashboardDefinitionId: new Types.ObjectId(dto.dashboardDefinitionId) }
        : {}),
      ...(dto.layout !== undefined
        ? { layout: this.reportDefinitionSanitizer.sanitizeLayout(dto.layout) }
        : {}),
      ...(dto.sections !== undefined
        ? { sections: this.reportDefinitionSanitizer.sanitizeSections(dto.sections) }
        : {}),
      ...(dto.blocks !== undefined
        ? { blocks: this.reportDefinitionSanitizer.sanitizeBlocks(dto.blocks) }
        : {}),
      ...(dto.filters !== undefined
        ? { filters: this.reportDefinitionSanitizer.sanitizeFilters(dto.filters) }
        : {}),
      ...(dto.parameters !== undefined
        ? { parameters: this.reportDefinitionSanitizer.sanitizeParameters(dto.parameters) }
        : {}),
      ...(dto.exportOptions !== undefined
        ? { exportOptions: sanitizeMetadata(dto.exportOptions) }
        : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.metadata !== undefined ? { metadata: sanitizeMetadata(dto.metadata) } : {}),
      ...(dto.settings !== undefined ? { settings: sanitizeMetadata(dto.settings) } : {}),
      updatedBy: actor.actorId,
    };
  }

  private async recordAudit(
    action: string,
    reportDefinition: ReportDefinitionDocument,
    actor: ReportDefinitionActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: reportDefinition.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'report_definition',
      entityId: reportDefinition._id.toString(),
      metadata: {
        reportKey: reportDefinition.reportKey,
        status: reportDefinition.status,
        visibility: reportDefinition.visibility,
        queryDefinitionId: reportDefinition.queryDefinitionId?.toString(),
        dashboardDefinitionId: reportDefinition.dashboardDefinitionId?.toString(),
        sectionsCount: reportDefinition.sections.length,
        blocksCount: reportDefinition.blocks.length,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(reportDefinition: ReportDefinitionDocument): ReportDefinitionResponseDto {
    return {
      id: reportDefinition._id.toString(),
      tenantId: reportDefinition.tenantId.toString(),
      reportKey: reportDefinition.reportKey,
      name: reportDefinition.name,
      description: reportDefinition.description,
      status: reportDefinition.status,
      visibility: reportDefinition.visibility,
      queryDefinitionId: reportDefinition.queryDefinitionId?.toString(),
      dashboardDefinitionId: reportDefinition.dashboardDefinitionId?.toString(),
      layout: this.toLayoutResponse(reportDefinition.layout),
      sections: reportDefinition.sections.map((section) => this.toSectionResponse(section)),
      blocks: reportDefinition.blocks.map((block) => this.toBlockResponse(block)),
      filters: reportDefinition.filters.map((filter) => this.toFilterResponse(filter)),
      parameters: reportDefinition.parameters.map((parameter) =>
        this.toParameterResponse(parameter),
      ),
      exportOptions: reportDefinition.exportOptions,
      tags: reportDefinition.tags,
      metadata: reportDefinition.metadata,
      settings: reportDefinition.settings,
      createdAt: reportDefinition.createdAt.toISOString(),
      updatedAt: reportDefinition.updatedAt.toISOString(),
      createdBy: reportDefinition.createdBy,
      updatedBy: reportDefinition.updatedBy,
    };
  }

  private toLayoutResponse(layout: ReportDefinitionLayout): ReportDefinitionLayoutResponseDto {
    return {
      type: layout.type,
      columns: layout.columns,
      density: layout.density,
    };
  }

  private toSectionResponse(section: ReportDefinitionSection): ReportDefinitionSectionResponseDto {
    return {
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout ? this.toLayoutResponse(section.layout) : undefined,
    };
  }

  private toBlockResponse(block: ReportDefinitionBlock): ReportDefinitionBlockResponseDto {
    return {
      key: block.key,
      title: block.title,
      description: block.description,
      type: block.type,
      queryDefinitionId: block.queryDefinitionId?.toString(),
      dashboardDefinitionId: block.dashboardDefinitionId?.toString(),
      sectionKey: block.sectionKey,
      order: block.order,
      options: block.options,
    };
  }

  private toFilterResponse(filter: ReportDefinitionFilter): ReportDefinitionFilterResponseDto {
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

  private toParameterResponse(
    parameter: ReportDefinitionParameter,
  ): ReportDefinitionParameterResponseDto {
    return {
      key: parameter.key,
      label: parameter.label,
      type: parameter.type,
      required: parameter.required,
      defaultValue: parameter.defaultValue,
      allowedValues: parameter.allowedValues,
    };
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException('Report key already exists for tenant.');
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
