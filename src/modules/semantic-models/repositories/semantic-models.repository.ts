import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModel,
  SemanticModelDocument,
  SemanticModelQuality,
  SemanticModelStatus,
} from '../schemas/semantic-model.schema';

export interface CreateSemanticModelRecord {
  tenantId: Types.ObjectId;
  modelKey: string;
  name: string;
  description?: string;
  status?: SemanticModel['status'];
  datasetKeys: string[];
  owner?: string;
  steward?: string;
  certificationOwner?: string;
  tags: string[];
  quality: SemanticModelQuality;
  measures: SemanticMeasure[];
  dimensions: SemanticDimension[];
  glossaryTerms: SemanticGlossaryTerm[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateSemanticModelRecord = Partial<
  Omit<CreateSemanticModelRecord, 'tenantId' | 'createdBy'>
>;

export interface SemanticModelFilters {
  tenantId: Types.ObjectId;
  modelKey?: string;
  status?: SemanticModelStatus;
}

@Injectable()
export class SemanticModelsRepository {
  constructor(
    @InjectModel(SemanticModel.name)
    private readonly semanticModelModel: Model<SemanticModelDocument>,
  ) {}

  create(record: CreateSemanticModelRecord): Promise<SemanticModelDocument> {
    return this.semanticModelModel.create(record);
  }

  findByFilters(
    filters: SemanticModelFilters,
    page: number,
    pageSize: number,
  ): Promise<SemanticModelDocument[]> {
    return this.semanticModelModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: SemanticModelFilters): Promise<number> {
    return this.semanticModelModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
  ): Promise<SemanticModelDocument | null> {
    return this.semanticModelModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateSemanticModelRecord,
  ): Promise<SemanticModelDocument | null> {
    return this.semanticModelModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  archiveByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    updatedBy?: string,
  ): Promise<SemanticModelDocument | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: SemanticModelStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(
    filters: SemanticModelFilters,
  ): FilterQuery<SemanticModelDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.modelKey ? { modelKey: filters.modelKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
  }
}
