import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModel,
  SemanticModelDocument,
  SemanticModelQuality,
  SemanticModelStatus,
} from '../schemas/semantic-model.schema';
import {
  CreateSemanticModelRecord,
  SemanticModelFilters,
  SemanticModelRecord,
  SemanticModelsRepository,
  UpdateSemanticModelRecord,
} from './semantic-models.repository';

function toQualityRecord(quality: SemanticModelQuality): SemanticModelQuality {
  return {
    score: quality.score,
    level: quality.level,
    warnings: quality.warnings ?? [],
  };
}

function toMeasureRecord(measure: SemanticMeasure): SemanticMeasure {
  return {
    key: measure.key,
    name: measure.name,
    description: measure.description,
    aggregation: measure.aggregation,
    semanticType: measure.semanticType,
    datasetKey: measure.datasetKey,
    fieldKey: measure.fieldKey,
    unit: measure.unit,
    formatHint: measure.formatHint,
    status: measure.status,
    owner: measure.owner,
    tags: measure.tags ?? [],
    isReusable: measure.isReusable ?? false,
    warnings: measure.warnings ?? [],
    metadata: measure.metadata,
  };
}

function toDimensionRecord(dimension: SemanticDimension): SemanticDimension {
  return {
    key: dimension.key,
    name: dimension.name,
    description: dimension.description,
    semanticType: dimension.semanticType,
    domain: dimension.domain,
    datasetKey: dimension.datasetKey,
    fieldKey: dimension.fieldKey,
    cardinalityHint: dimension.cardinalityHint,
    status: dimension.status,
    owner: dimension.owner,
    tags: dimension.tags ?? [],
    warnings: dimension.warnings ?? [],
    metadata: dimension.metadata,
  };
}

function toGlossaryTermRecord(term: SemanticGlossaryTerm): SemanticGlossaryTerm {
  return {
    key: term.key,
    name: term.name,
    description: term.description,
    aliases: term.aliases ?? [],
    domain: term.domain,
    relatedMeasureKeys: term.relatedMeasureKeys ?? [],
    relatedDimensionKeys: term.relatedDimensionKeys ?? [],
    status: term.status,
    owner: term.owner,
    tags: term.tags ?? [],
    metadata: term.metadata,
  };
}

function toRecord(doc: SemanticModelDocument): SemanticModelRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    modelKey: doc.modelKey,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    datasetKeys: doc.datasetKeys,
    owner: doc.owner,
    steward: doc.steward,
    certificationOwner: doc.certificationOwner,
    tags: doc.tags,
    quality: toQualityRecord(doc.quality),
    measures: doc.measures.map(toMeasureRecord),
    dimensions: doc.dimensions.map(toDimensionRecord),
    glossaryTerms: doc.glossaryTerms.map(toGlossaryTermRecord),
    metadata: doc.metadata,
    settings: doc.settings,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoSemanticModelsRepository extends SemanticModelsRepository {
  constructor(
    @InjectModel(SemanticModel.name)
    private readonly semanticModelModel: Model<SemanticModelDocument>,
  ) {
    super();
  }

  async create(record: CreateSemanticModelRecord): Promise<SemanticModelRecord> {
    const created = await this.semanticModelModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      modelKey: record.modelKey,
      name: record.name,
      description: record.description,
      status: record.status,
      datasetKeys: record.datasetKeys,
      owner: record.owner,
      steward: record.steward,
      certificationOwner: record.certificationOwner,
      tags: record.tags,
      quality: record.quality,
      measures: record.measures,
      dimensions: record.dimensions,
      glossaryTerms: record.glossaryTerms,
      metadata: record.metadata,
      settings: record.settings,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: SemanticModelFilters,
    page: number,
    pageSize: number,
  ): Promise<SemanticModelRecord[]> {
    const docs = await this.semanticModelModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: SemanticModelFilters): Promise<number> {
    return this.semanticModelModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<SemanticModelRecord | null> {
    const doc = await this.semanticModelModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateSemanticModelRecord,
  ): Promise<SemanticModelRecord | null> {
    const doc = await this.semanticModelModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      record,
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }

  archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<SemanticModelRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: SemanticModelStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: SemanticModelFilters): FilterQuery<SemanticModelDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.modelKey ? { modelKey: filters.modelKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
  }
}
