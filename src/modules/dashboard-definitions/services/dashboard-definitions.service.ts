import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateDashboardDefinitionDto } from '../dto/create-dashboard-definition.dto';
import {
  ListDashboardDefinitionsQueryDto,
  DashboardDefinitionTenantQueryDto,
} from '../dto/dashboard-definition-query.dto';
import {
  DashboardDefinitionFilterResponseDto,
  DashboardDefinitionLayoutResponseDto,
  DashboardDefinitionResponseDto,
  DashboardDefinitionSectionResponseDto,
  DashboardDefinitionVisualizationResponseDto,
  DashboardDefinitionWidgetResponseDto,
} from '../dto/dashboard-definition-response.dto';
import { UpdateDashboardDefinitionDto } from '../dto/update-dashboard-definition.dto';
import {
  DashboardDefinitionsRepository,
  UpdateDashboardDefinitionRecord,
} from '../repositories/dashboard-definitions.repository';
import {
  DashboardDefinitionDocument,
  DashboardDefinitionFilter,
  DashboardDefinitionLayout,
  DashboardDefinitionSection,
  DashboardDefinitionVisualization,
  DashboardDefinitionWidget,
} from '../schemas/dashboard-definition.schema';
import { DashboardDefinitionSanitizerService } from './dashboard-definition-sanitizer.service';

export interface DashboardDefinitionActorContext {
  actorId?: string;
}

@Injectable()
export class DashboardDefinitionsService {
  constructor(
    private readonly dashboardDefinitionsRepository: DashboardDefinitionsRepository,
    private readonly dashboardDefinitionSanitizer: DashboardDefinitionSanitizerService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateDashboardDefinitionDto,
    actor: DashboardDefinitionActorContext = {},
  ): Promise<DashboardDefinitionResponseDto> {
    try {
      const dashboardDefinition = await this.dashboardDefinitionsRepository.create({
        tenantId: new Types.ObjectId(dto.tenantId),
        dashboardKey: dto.dashboardKey,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        visibility: dto.visibility,
        layout: this.dashboardDefinitionSanitizer.sanitizeLayout(dto.layout),
        sections: this.dashboardDefinitionSanitizer.sanitizeSections(dto.sections),
        widgets: this.dashboardDefinitionSanitizer.sanitizeWidgets(dto.widgets),
        filters: this.dashboardDefinitionSanitizer.sanitizeFilters(dto.filters),
        tags: dto.tags ?? [],
        metadata: sanitizeMetadata(dto.metadata),
        settings: sanitizeMetadata(dto.settings),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      });

      await this.recordAudit('dashboard_definition.created', dashboardDefinition, actor);

      return this.toResponse(dashboardDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findByFilters(
    query: ListDashboardDefinitionsQueryDto,
  ): Promise<ListResponse<DashboardDefinitionResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      dashboardKey: query.dashboardKey,
      status: query.status,
      visibility: query.visibility,
    };
    const [items, total] = await Promise.all([
      this.dashboardDefinitionsRepository.findByFilters(filters, query.page, query.pageSize),
      this.dashboardDefinitionsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((dashboardDefinition) => this.toResponse(dashboardDefinition)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(
    tenantId: DashboardDefinitionTenantQueryDto['tenantId'],
    id: string,
  ): Promise<DashboardDefinitionResponseDto> {
    const dashboardDefinition = await this.dashboardDefinitionsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

    if (!dashboardDefinition) {
      throw new NotFoundException('Dashboard definition not found.');
    }

    return this.toResponse(dashboardDefinition);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDashboardDefinitionDto,
    actor: DashboardDefinitionActorContext = {},
  ): Promise<DashboardDefinitionResponseDto> {
    try {
      const dashboardDefinition = await this.dashboardDefinitionsRepository.updateByTenantAndId(
        new Types.ObjectId(tenantId),
        id,
        this.toUpdateRecord(dto, actor),
      );

      if (!dashboardDefinition) {
        throw new NotFoundException('Dashboard definition not found.');
      }

      await this.recordAudit('dashboard_definition.updated', dashboardDefinition, actor);

      return this.toResponse(dashboardDefinition);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async archive(
    tenantId: string,
    id: string,
    actor: DashboardDefinitionActorContext = {},
  ): Promise<DashboardDefinitionResponseDto> {
    const dashboardDefinition = await this.dashboardDefinitionsRepository.archiveByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      actor.actorId,
    );

    if (!dashboardDefinition) {
      throw new NotFoundException('Dashboard definition not found.');
    }

    await this.recordAudit('dashboard_definition.archived', dashboardDefinition, actor);

    return this.toResponse(dashboardDefinition);
  }

  private toUpdateRecord(
    dto: UpdateDashboardDefinitionDto,
    actor: DashboardDefinitionActorContext,
  ): UpdateDashboardDefinitionRecord {
    return {
      ...(dto.dashboardKey !== undefined ? { dashboardKey: dto.dashboardKey } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      ...(dto.layout !== undefined
        ? { layout: this.dashboardDefinitionSanitizer.sanitizeLayout(dto.layout) }
        : {}),
      ...(dto.sections !== undefined
        ? { sections: this.dashboardDefinitionSanitizer.sanitizeSections(dto.sections) }
        : {}),
      ...(dto.widgets !== undefined
        ? { widgets: this.dashboardDefinitionSanitizer.sanitizeWidgets(dto.widgets) }
        : {}),
      ...(dto.filters !== undefined
        ? { filters: this.dashboardDefinitionSanitizer.sanitizeFilters(dto.filters) }
        : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.metadata !== undefined ? { metadata: sanitizeMetadata(dto.metadata) } : {}),
      ...(dto.settings !== undefined ? { settings: sanitizeMetadata(dto.settings) } : {}),
      updatedBy: actor.actorId,
    };
  }

  private async recordAudit(
    action: string,
    dashboardDefinition: DashboardDefinitionDocument,
    actor: DashboardDefinitionActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: dashboardDefinition.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'dashboard_definition',
      entityId: dashboardDefinition._id.toString(),
      metadata: {
        dashboardKey: dashboardDefinition.dashboardKey,
        status: dashboardDefinition.status,
        visibility: dashboardDefinition.visibility,
        sectionsCount: dashboardDefinition.sections.length,
        widgetsCount: dashboardDefinition.widgets.length,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(
    dashboardDefinition: DashboardDefinitionDocument,
  ): DashboardDefinitionResponseDto {
    return {
      id: dashboardDefinition._id.toString(),
      tenantId: dashboardDefinition.tenantId.toString(),
      dashboardKey: dashboardDefinition.dashboardKey,
      name: dashboardDefinition.name,
      description: dashboardDefinition.description,
      status: dashboardDefinition.status,
      visibility: dashboardDefinition.visibility,
      layout: this.toLayoutResponse(dashboardDefinition.layout),
      sections: dashboardDefinition.sections.map((section) => this.toSectionResponse(section)),
      widgets: dashboardDefinition.widgets.map((widget) => this.toWidgetResponse(widget)),
      filters: dashboardDefinition.filters.map((filter) => this.toFilterResponse(filter)),
      tags: dashboardDefinition.tags,
      metadata: dashboardDefinition.metadata,
      settings: dashboardDefinition.settings,
      createdAt: dashboardDefinition.createdAt.toISOString(),
      updatedAt: dashboardDefinition.updatedAt.toISOString(),
      createdBy: dashboardDefinition.createdBy,
      updatedBy: dashboardDefinition.updatedBy,
    };
  }

  private toLayoutResponse(
    layout: DashboardDefinitionLayout,
  ): DashboardDefinitionLayoutResponseDto {
    return {
      type: layout.type,
      columns: layout.columns,
      gap: layout.gap,
      density: layout.density,
    };
  }

  private toSectionResponse(
    section: DashboardDefinitionSection,
  ): DashboardDefinitionSectionResponseDto {
    return {
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout ? this.toLayoutResponse(section.layout) : undefined,
    };
  }

  private toWidgetResponse(
    widget: DashboardDefinitionWidget,
  ): DashboardDefinitionWidgetResponseDto {
    return {
      key: widget.key,
      title: widget.title,
      description: widget.description,
      type: widget.type,
      queryDefinitionId: widget.queryDefinitionId?.toString(),
      sectionKey: widget.sectionKey,
      order: widget.order,
      size: widget.size,
      position: widget.position,
      visualization: widget.visualization
        ? this.toVisualizationResponse(widget.visualization)
        : undefined,
      options: widget.options,
    };
  }

  private toVisualizationResponse(
    visualization: DashboardDefinitionVisualization,
  ): DashboardDefinitionVisualizationResponseDto {
    return {
      chartType: visualization.chartType,
      xField: visualization.xField,
      yFields: visualization.yFields,
      groupBy: visualization.groupBy,
      format: visualization.format,
    };
  }

  private toFilterResponse(
    filter: DashboardDefinitionFilter,
  ): DashboardDefinitionFilterResponseDto {
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

  private handlePersistenceError(error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException('Dashboard key already exists for tenant.');
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
