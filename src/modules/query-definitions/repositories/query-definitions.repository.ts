import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  QueryDefinition,
  QueryDefinitionDimension,
  QueryDefinitionDocument,
  QueryDefinitionFilter,
  QueryDefinitionMetric,
  QueryDefinitionSort,
  QueryDefinitionStatus,
  QueryDefinitionType,
} from '../schemas/query-definition.schema';

export interface CreateQueryDefinitionRecord {
  tenantId: Types.ObjectId;
  datasetId: Types.ObjectId;
  queryKey: string;
  name: string;
  description?: string;
  status?: QueryDefinition['status'];
  type?: QueryDefinition['type'];
  metrics: QueryDefinitionMetric[];
  dimensions: QueryDefinitionDimension[];
  filters: QueryDefinitionFilter[];
  sorts: QueryDefinitionSort[];
  defaultLimit?: number;
  timeField?: string;
  allowedGranularities: QueryDefinition['allowedGranularities'];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateQueryDefinitionRecord = Partial<
  Omit<CreateQueryDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface QueryDefinitionFilters {
  tenantId: Types.ObjectId;
  datasetId?: Types.ObjectId;
  queryKey?: string;
  status?: QueryDefinitionStatus;
  type?: QueryDefinitionType;
}

@Injectable()
export class QueryDefinitionsRepository {
  constructor(
    @InjectModel(QueryDefinition.name)
    private readonly queryDefinitionModel: Model<QueryDefinitionDocument>,
  ) {}

  create(record: CreateQueryDefinitionRecord): Promise<QueryDefinitionDocument> {
    return this.queryDefinitionModel.create(record);
  }

  findByFilters(
    filters: QueryDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<QueryDefinitionDocument[]> {
    return this.queryDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: QueryDefinitionFilters): Promise<number> {
    return this.queryDefinitionModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(tenantId: Types.ObjectId, id: string): Promise<QueryDefinitionDocument | null> {
    return this.queryDefinitionModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateQueryDefinitionRecord,
  ): Promise<QueryDefinitionDocument | null> {
    return this.queryDefinitionModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  archiveByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    updatedBy?: string,
  ): Promise<QueryDefinitionDocument | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: QueryDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: QueryDefinitionFilters): FilterQuery<QueryDefinitionDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.datasetId ? { datasetId: filters.datasetId } : {}),
      ...(filters.queryKey ? { queryKey: filters.queryKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };
  }
}
