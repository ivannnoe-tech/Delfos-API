import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  DashboardDefinition,
  DashboardDefinitionDocument,
  DashboardDefinitionStatus,
  DashboardDefinitionWidget,
} from '../schemas/dashboard-definition.schema';
import {
  CreateDashboardDefinitionRecord,
  DashboardDefinitionFilters,
  DashboardDefinitionRecord,
  DashboardDefinitionsRepository,
  DashboardDefinitionWidgetRecord,
  UpdateDashboardDefinitionRecord,
} from './dashboard-definitions.repository';

function toWidgetRecord(widget: DashboardDefinitionWidget): DashboardDefinitionWidgetRecord {
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
    visualization: widget.visualization,
    options: widget.options,
  };
}

function toWidgetDocument(widget: DashboardDefinitionWidgetRecord): DashboardDefinitionWidget {
  return {
    key: widget.key,
    title: widget.title,
    description: widget.description,
    type: widget.type,
    queryDefinitionId: widget.queryDefinitionId
      ? new Types.ObjectId(widget.queryDefinitionId)
      : undefined,
    sectionKey: widget.sectionKey,
    order: widget.order,
    size: widget.size,
    position: widget.position,
    visualization: widget.visualization,
    options: widget.options,
  };
}

function toRecord(doc: DashboardDefinitionDocument): DashboardDefinitionRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    dashboardKey: doc.dashboardKey,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    visibility: doc.visibility,
    layout: {
      type: doc.layout.type,
      columns: doc.layout.columns,
      gap: doc.layout.gap,
      density: doc.layout.density,
    },
    sections: doc.sections.map((section) => ({
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout,
    })),
    widgets: doc.widgets.map(toWidgetRecord),
    filters: doc.filters.map((filter) => ({
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required,
      defaultValue: filter.defaultValue,
      allowedValues: filter.allowedValues,
    })),
    tags: doc.tags,
    metadata: doc.metadata,
    settings: doc.settings,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoDashboardDefinitionsRepository extends DashboardDefinitionsRepository {
  constructor(
    @InjectModel(DashboardDefinition.name)
    private readonly dashboardDefinitionModel: Model<DashboardDefinitionDocument>,
  ) {
    super();
  }

  async create(record: CreateDashboardDefinitionRecord): Promise<DashboardDefinitionRecord> {
    const created = await this.dashboardDefinitionModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      dashboardKey: record.dashboardKey,
      name: record.name,
      description: record.description,
      status: record.status,
      visibility: record.visibility,
      layout: record.layout,
      sections: record.sections,
      widgets: record.widgets.map(toWidgetDocument),
      filters: record.filters,
      tags: record.tags,
      metadata: record.metadata,
      settings: record.settings,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: DashboardDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<DashboardDefinitionRecord[]> {
    const docs = await this.dashboardDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: DashboardDefinitionFilters): Promise<number> {
    return this.dashboardDefinitionModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<DashboardDefinitionRecord | null> {
    const doc = await this.dashboardDefinitionModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDashboardDefinitionRecord,
  ): Promise<DashboardDefinitionRecord | null> {
    const doc = await this.dashboardDefinitionModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      this.toMongoUpdate(record),
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }

  archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<DashboardDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DashboardDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(
    filters: DashboardDefinitionFilters,
  ): FilterQuery<DashboardDefinitionDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.dashboardKey ? { dashboardKey: filters.dashboardKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
    };
  }

  private toMongoUpdate(record: UpdateDashboardDefinitionRecord): Record<string, unknown> {
    const { widgets, ...rest } = record;

    return {
      ...rest,
      ...(widgets !== undefined ? { widgets: widgets.map(toWidgetDocument) } : {}),
    };
  }
}
