import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  ReportDefinition,
  ReportDefinitionBlock,
  ReportDefinitionDocument,
  ReportDefinitionStatus,
} from '../schemas/report-definition.schema';
import {
  CreateReportDefinitionRecord,
  ReportDefinitionBlockRecord,
  ReportDefinitionFilters,
  ReportDefinitionRecord,
  ReportDefinitionsRepository,
  UpdateReportDefinitionRecord,
} from './report-definitions.repository';

function toBlockRecord(block: ReportDefinitionBlock): ReportDefinitionBlockRecord {
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

function toBlockDocument(block: ReportDefinitionBlockRecord): ReportDefinitionBlock {
  return {
    key: block.key,
    title: block.title,
    description: block.description,
    type: block.type,
    queryDefinitionId: block.queryDefinitionId
      ? new Types.ObjectId(block.queryDefinitionId)
      : undefined,
    dashboardDefinitionId: block.dashboardDefinitionId
      ? new Types.ObjectId(block.dashboardDefinitionId)
      : undefined,
    sectionKey: block.sectionKey,
    order: block.order,
    options: block.options,
  };
}

function toRecord(doc: ReportDefinitionDocument): ReportDefinitionRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    reportKey: doc.reportKey,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    visibility: doc.visibility,
    queryDefinitionId: doc.queryDefinitionId?.toString(),
    dashboardDefinitionId: doc.dashboardDefinitionId?.toString(),
    layout: {
      type: doc.layout.type,
      columns: doc.layout.columns,
      density: doc.layout.density,
    },
    sections: doc.sections.map((section) => ({
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout,
    })),
    blocks: doc.blocks.map(toBlockRecord),
    filters: doc.filters.map((filter) => ({
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required,
      defaultValue: filter.defaultValue,
      allowedValues: filter.allowedValues,
    })),
    parameters: doc.parameters.map((parameter) => ({
      key: parameter.key,
      label: parameter.label,
      type: parameter.type,
      required: parameter.required,
      defaultValue: parameter.defaultValue,
      allowedValues: parameter.allowedValues,
    })),
    exportOptions: doc.exportOptions,
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
export class MongoReportDefinitionsRepository extends ReportDefinitionsRepository {
  constructor(
    @InjectModel(ReportDefinition.name)
    private readonly reportDefinitionModel: Model<ReportDefinitionDocument>,
  ) {
    super();
  }

  async create(record: CreateReportDefinitionRecord): Promise<ReportDefinitionRecord> {
    const created = await this.reportDefinitionModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      reportKey: record.reportKey,
      name: record.name,
      description: record.description,
      status: record.status,
      visibility: record.visibility,
      queryDefinitionId: record.queryDefinitionId
        ? new Types.ObjectId(record.queryDefinitionId)
        : undefined,
      dashboardDefinitionId: record.dashboardDefinitionId
        ? new Types.ObjectId(record.dashboardDefinitionId)
        : undefined,
      layout: record.layout,
      sections: record.sections,
      blocks: record.blocks.map(toBlockDocument),
      filters: record.filters,
      parameters: record.parameters,
      exportOptions: record.exportOptions,
      tags: record.tags,
      metadata: record.metadata,
      settings: record.settings,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: ReportDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<ReportDefinitionRecord[]> {
    const docs = await this.reportDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: ReportDefinitionFilters): Promise<number> {
    return this.reportDefinitionModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ReportDefinitionRecord | null> {
    const doc = await this.reportDefinitionModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateReportDefinitionRecord,
  ): Promise<ReportDefinitionRecord | null> {
    const doc = await this.reportDefinitionModel.findOneAndUpdate(
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
  ): Promise<ReportDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: ReportDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: ReportDefinitionFilters): FilterQuery<ReportDefinitionDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.reportKey ? { reportKey: filters.reportKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      ...(filters.queryDefinitionId
        ? { queryDefinitionId: new Types.ObjectId(filters.queryDefinitionId) }
        : {}),
      ...(filters.dashboardDefinitionId
        ? { dashboardDefinitionId: new Types.ObjectId(filters.dashboardDefinitionId) }
        : {}),
    };
  }

  private toMongoUpdate(record: UpdateReportDefinitionRecord): Record<string, unknown> {
    const { blocks, queryDefinitionId, dashboardDefinitionId, ...rest } = record;

    return {
      ...rest,
      ...(blocks !== undefined ? { blocks: blocks.map(toBlockDocument) } : {}),
      ...(queryDefinitionId !== undefined
        ? { queryDefinitionId: new Types.ObjectId(queryDefinitionId) }
        : {}),
      ...(dashboardDefinitionId !== undefined
        ? { dashboardDefinitionId: new Types.ObjectId(dashboardDefinitionId) }
        : {}),
    };
  }
}
