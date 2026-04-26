import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { FieldMapping, FieldMappingDocument, FieldMappingStatus } from '../schemas/field-mapping.schema';

export interface CreateFieldMappingRecord {
  tenantId: Types.ObjectId;
  connectionId?: Types.ObjectId;
  datasetKey: string;
  sourcePath: string;
  targetField: string;
  targetType: FieldMapping['targetType'];
  required?: boolean;
  transform?: FieldMapping['transform'];
  status?: FieldMapping['status'];
}

export type UpdateFieldMappingRecord = Partial<Omit<CreateFieldMappingRecord, 'tenantId'>>;

export interface FieldMappingFilters {
  tenantId: Types.ObjectId;
  datasetKey?: string;
  connectionId?: Types.ObjectId;
}

@Injectable()
export class FieldMappingsRepository {
  constructor(
    @InjectModel(FieldMapping.name)
    private readonly fieldMappingModel: Model<FieldMappingDocument>,
  ) {}

  create(record: CreateFieldMappingRecord): Promise<FieldMappingDocument> {
    return this.fieldMappingModel.create(record);
  }

  findByFilters(
    filters: FieldMappingFilters,
    page: number,
    pageSize: number,
  ): Promise<FieldMappingDocument[]> {
    return this.fieldMappingModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: FieldMappingFilters): Promise<number> {
    return this.fieldMappingModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateFieldMappingRecord,
  ): Promise<FieldMappingDocument | null> {
    return this.fieldMappingModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  deactivateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
  ): Promise<FieldMappingDocument | null> {
    return this.updateByTenantAndId(tenantId, id, { status: FieldMappingStatus.Inactive });
  }

  private toMongoFilters(filters: FieldMappingFilters): FilterQuery<FieldMappingDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.datasetKey ? { datasetKey: filters.datasetKey } : {}),
      ...(filters.connectionId ? { connectionId: filters.connectionId } : {}),
    };
  }
}
