import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  Dataset,
  DatasetDocument,
  DatasetField,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.schema';

export interface CreateDatasetRecord {
  tenantId: Types.ObjectId;
  connectionId?: Types.ObjectId;
  datasetKey: string;
  name: string;
  description?: string;
  sourceType?: Dataset['sourceType'];
  status?: Dataset['status'];
  refreshMode?: Dataset['refreshMode'];
  schemaMode?: Dataset['schemaMode'];
  fields: DatasetField[];
  primaryKeyFields: string[];
  timeField?: string;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateDatasetRecord = Partial<Omit<CreateDatasetRecord, 'tenantId' | 'createdBy'>>;

export interface DatasetFilters {
  tenantId: Types.ObjectId;
  connectionId?: Types.ObjectId;
  datasetKey?: string;
  status?: DatasetStatus;
  sourceType?: DatasetSourceType;
}

@Injectable()
export class DatasetsRepository {
  constructor(
    @InjectModel(Dataset.name)
    private readonly datasetModel: Model<DatasetDocument>,
  ) {}

  create(record: CreateDatasetRecord): Promise<DatasetDocument> {
    return this.datasetModel.create(record);
  }

  findByFilters(
    filters: DatasetFilters,
    page: number,
    pageSize: number,
  ): Promise<DatasetDocument[]> {
    return this.datasetModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: DatasetFilters): Promise<number> {
    return this.datasetModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(tenantId: Types.ObjectId, id: string): Promise<DatasetDocument | null> {
    return this.datasetModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateDatasetRecord,
  ): Promise<DatasetDocument | null> {
    return this.datasetModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  archiveByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    updatedBy?: string,
  ): Promise<DatasetDocument | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DatasetStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: DatasetFilters): FilterQuery<DatasetDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.connectionId ? { connectionId: filters.connectionId } : {}),
      ...(filters.datasetKey ? { datasetKey: filters.datasetKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    };
  }
}
