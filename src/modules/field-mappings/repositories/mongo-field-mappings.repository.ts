import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

import {
  FieldMapping,
  FieldMappingDocument,
  FieldMappingStatus,
} from '../schemas/field-mapping.schema';
import {
  CreateFieldMappingRecord,
  FieldMappingFilters,
  FieldMappingRecord,
  FieldMappingsRepository,
  UpdateFieldMappingRecord,
} from './field-mappings.repository';

function toRecord(doc: FieldMappingDocument): FieldMappingRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    connectionId: doc.connectionId?.toString(),
    datasetKey: doc.datasetKey,
    sourcePath: doc.sourcePath,
    targetField: doc.targetField,
    targetType: doc.targetType,
    required: doc.required,
    transform: doc.transform,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoFieldMappingsRepository extends FieldMappingsRepository {
  constructor(
    @InjectModel(FieldMapping.name)
    private readonly fieldMappingModel: Model<FieldMappingDocument>,
  ) {
    super();
  }

  async create(record: CreateFieldMappingRecord): Promise<FieldMappingRecord> {
    const created = await this.fieldMappingModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      connectionId: record.connectionId ? new Types.ObjectId(record.connectionId) : undefined,
      datasetKey: record.datasetKey,
      sourcePath: record.sourcePath,
      targetField: record.targetField,
      targetType: record.targetType,
      required: record.required,
      transform: record.transform,
      status: record.status,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: FieldMappingFilters,
    page: number,
    pageSize: number,
  ): Promise<FieldMappingRecord[]> {
    const docs = await this.fieldMappingModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: FieldMappingFilters): Promise<number> {
    return this.fieldMappingModel.countDocuments(this.toMongoFilters(filters));
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateFieldMappingRecord,
  ): Promise<FieldMappingRecord | null> {
    const doc = await this.fieldMappingModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      this.toMongoUpdate(record),
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }

  deactivateByTenantAndId(tenantId: string, id: string): Promise<FieldMappingRecord | null> {
    return this.updateByTenantAndId(tenantId, id, { status: FieldMappingStatus.Inactive });
  }

  private toMongoFilters(filters: FieldMappingFilters): FilterQuery<FieldMappingDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.datasetKey ? { datasetKey: filters.datasetKey } : {}),
      ...(filters.connectionId ? { connectionId: new Types.ObjectId(filters.connectionId) } : {}),
    };
  }

  private toMongoUpdate(record: UpdateFieldMappingRecord): UpdateQuery<FieldMappingDocument> {
    const { connectionId, ...rest } = record;

    return {
      ...rest,
      ...(connectionId !== undefined ? { connectionId: new Types.ObjectId(connectionId) } : {}),
    };
  }
}
