import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

import { Dataset, DatasetDocument, DatasetStatus } from '../schemas/dataset.schema';
import {
  CreateDatasetRecord,
  DatasetFilters,
  DatasetRecord,
  DatasetsRepository,
  UpdateDatasetRecord,
} from './datasets.repository';

function toRecord(doc: DatasetDocument): DatasetRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    connectionId: doc.connectionId?.toString(),
    datasetKey: doc.datasetKey,
    name: doc.name,
    description: doc.description,
    sourceType: doc.sourceType,
    status: doc.status,
    refreshMode: doc.refreshMode,
    schemaMode: doc.schemaMode,
    fields: doc.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      description: field.description,
      sampleMasked: field.sampleMasked,
      semanticRole: field.semanticRole,
    })),
    primaryKeyFields: doc.primaryKeyFields,
    timeField: doc.timeField,
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
export class MongoDatasetsRepository extends DatasetsRepository {
  constructor(
    @InjectModel(Dataset.name)
    private readonly datasetModel: Model<DatasetDocument>,
  ) {
    super();
  }

  async create(record: CreateDatasetRecord): Promise<DatasetRecord> {
    const created = await this.datasetModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      connectionId: record.connectionId ? new Types.ObjectId(record.connectionId) : undefined,
      datasetKey: record.datasetKey,
      name: record.name,
      description: record.description,
      sourceType: record.sourceType,
      status: record.status,
      refreshMode: record.refreshMode,
      schemaMode: record.schemaMode,
      fields: record.fields,
      primaryKeyFields: record.primaryKeyFields,
      timeField: record.timeField,
      tags: record.tags,
      metadata: record.metadata,
      settings: record.settings,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: DatasetFilters,
    page: number,
    pageSize: number,
  ): Promise<DatasetRecord[]> {
    const docs = await this.datasetModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: DatasetFilters): Promise<number> {
    return this.datasetModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<DatasetRecord | null> {
    const doc = await this.datasetModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDatasetRecord,
  ): Promise<DatasetRecord | null> {
    const doc = await this.datasetModel.findOneAndUpdate(
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
  ): Promise<DatasetRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DatasetStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: DatasetFilters): FilterQuery<DatasetDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.connectionId ? { connectionId: new Types.ObjectId(filters.connectionId) } : {}),
      ...(filters.datasetKey ? { datasetKey: filters.datasetKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    };
  }

  private toMongoUpdate(record: UpdateDatasetRecord): UpdateQuery<DatasetDocument> {
    const { connectionId, ...rest } = record;

    return {
      ...rest,
      ...(connectionId !== undefined ? { connectionId: new Types.ObjectId(connectionId) } : {}),
    };
  }
}
