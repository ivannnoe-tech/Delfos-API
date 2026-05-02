import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  ReportDefinition,
  ReportDefinitionBlock,
  ReportDefinitionDocument,
  ReportDefinitionFilter,
  ReportDefinitionParameter,
  ReportDefinitionSection,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.schema';

export interface CreateReportDefinitionRecord {
  tenantId: Types.ObjectId;
  reportKey: string;
  name: string;
  description?: string;
  status?: ReportDefinition['status'];
  visibility?: ReportDefinition['visibility'];
  queryDefinitionId?: Types.ObjectId;
  dashboardDefinitionId?: Types.ObjectId;
  layout: ReportDefinition['layout'];
  sections: ReportDefinitionSection[];
  blocks: ReportDefinitionBlock[];
  filters: ReportDefinitionFilter[];
  parameters: ReportDefinitionParameter[];
  exportOptions: SanitizedMetadata;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateReportDefinitionRecord = Partial<
  Omit<CreateReportDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface ReportDefinitionFilters {
  tenantId: Types.ObjectId;
  reportKey?: string;
  status?: ReportDefinitionStatus;
  visibility?: ReportDefinitionVisibility;
  queryDefinitionId?: Types.ObjectId;
  dashboardDefinitionId?: Types.ObjectId;
}

@Injectable()
export class ReportDefinitionsRepository {
  constructor(
    @InjectModel(ReportDefinition.name)
    private readonly reportDefinitionModel: Model<ReportDefinitionDocument>,
  ) {}

  create(record: CreateReportDefinitionRecord): Promise<ReportDefinitionDocument> {
    return this.reportDefinitionModel.create(record);
  }

  findByFilters(
    filters: ReportDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<ReportDefinitionDocument[]> {
    return this.reportDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: ReportDefinitionFilters): Promise<number> {
    return this.reportDefinitionModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
  ): Promise<ReportDefinitionDocument | null> {
    return this.reportDefinitionModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateReportDefinitionRecord,
  ): Promise<ReportDefinitionDocument | null> {
    return this.reportDefinitionModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  archiveByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    updatedBy?: string,
  ): Promise<ReportDefinitionDocument | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: ReportDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: ReportDefinitionFilters): FilterQuery<ReportDefinitionDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.reportKey ? { reportKey: filters.reportKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      ...(filters.queryDefinitionId ? { queryDefinitionId: filters.queryDefinitionId } : {}),
      ...(filters.dashboardDefinitionId
        ? { dashboardDefinitionId: filters.dashboardDefinitionId }
        : {}),
    };
  }
}
