import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  DashboardDefinition,
  DashboardDefinitionDocument,
  DashboardDefinitionFilter,
  DashboardDefinitionSection,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidget,
} from '../schemas/dashboard-definition.schema';

export interface CreateDashboardDefinitionRecord {
  tenantId: Types.ObjectId;
  dashboardKey: string;
  name: string;
  description?: string;
  status?: DashboardDefinition['status'];
  visibility?: DashboardDefinition['visibility'];
  layout: DashboardDefinition['layout'];
  sections: DashboardDefinitionSection[];
  widgets: DashboardDefinitionWidget[];
  filters: DashboardDefinitionFilter[];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateDashboardDefinitionRecord = Partial<
  Omit<CreateDashboardDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface DashboardDefinitionFilters {
  tenantId: Types.ObjectId;
  dashboardKey?: string;
  status?: DashboardDefinitionStatus;
  visibility?: DashboardDefinitionVisibility;
}

@Injectable()
export class DashboardDefinitionsRepository {
  constructor(
    @InjectModel(DashboardDefinition.name)
    private readonly dashboardDefinitionModel: Model<DashboardDefinitionDocument>,
  ) {}

  create(record: CreateDashboardDefinitionRecord): Promise<DashboardDefinitionDocument> {
    return this.dashboardDefinitionModel.create(record);
  }

  findByFilters(
    filters: DashboardDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<DashboardDefinitionDocument[]> {
    return this.dashboardDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: DashboardDefinitionFilters): Promise<number> {
    return this.dashboardDefinitionModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
  ): Promise<DashboardDefinitionDocument | null> {
    return this.dashboardDefinitionModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateDashboardDefinitionRecord,
  ): Promise<DashboardDefinitionDocument | null> {
    return this.dashboardDefinitionModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  archiveByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    updatedBy?: string,
  ): Promise<DashboardDefinitionDocument | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DashboardDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(
    filters: DashboardDefinitionFilters,
  ): FilterQuery<DashboardDefinitionDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.dashboardKey ? { dashboardKey: filters.dashboardKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
    };
  }
}
