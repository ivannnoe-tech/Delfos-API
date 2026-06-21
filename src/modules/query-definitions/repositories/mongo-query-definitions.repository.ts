import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  QueryDefinition,
  QueryDefinitionDocument,
  QueryDefinitionStatus,
} from '../schemas/query-definition.schema';
import {
  CreateQueryDefinitionRecord,
  QueryDefinitionFilters,
  QueryDefinitionRecord,
  QueryDefinitionsRepository,
  UpdateQueryDefinitionRecord,
} from './query-definitions.repository';

function toRecord(doc: QueryDefinitionDocument): QueryDefinitionRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    datasetId: doc.datasetId.toString(),
    queryKey: doc.queryKey,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    type: doc.type,
    metrics: doc.metrics.map((metric) => ({
      key: metric.key,
      label: metric.label,
      field: metric.field,
      aggregation: metric.aggregation,
      format: metric.format,
      description: metric.description,
    })),
    dimensions: doc.dimensions.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      field: dimension.field,
      type: dimension.type,
      description: dimension.description,
    })),
    filters: doc.filters.map((filter) => ({
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required,
      defaultValue: filter.defaultValue,
      allowedValues: filter.allowedValues,
    })),
    sorts: doc.sorts.map((sort) => ({
      field: sort.field,
      direction: sort.direction,
    })),
    defaultLimit: doc.defaultLimit,
    timeField: doc.timeField,
    allowedGranularities: doc.allowedGranularities,
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
export class MongoQueryDefinitionsRepository extends QueryDefinitionsRepository {
  constructor(
    @InjectModel(QueryDefinition.name)
    private readonly queryDefinitionModel: Model<QueryDefinitionDocument>,
  ) {
    super();
  }

  async create(record: CreateQueryDefinitionRecord): Promise<QueryDefinitionRecord> {
    const created = await this.queryDefinitionModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      datasetId: new Types.ObjectId(record.datasetId),
      queryKey: record.queryKey,
      name: record.name,
      description: record.description,
      status: record.status,
      type: record.type,
      metrics: record.metrics,
      dimensions: record.dimensions,
      filters: record.filters,
      sorts: record.sorts,
      defaultLimit: record.defaultLimit,
      timeField: record.timeField,
      allowedGranularities: record.allowedGranularities,
      tags: record.tags,
      metadata: record.metadata,
      settings: record.settings,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: QueryDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<QueryDefinitionRecord[]> {
    const docs = await this.queryDefinitionModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: QueryDefinitionFilters): Promise<number> {
    return this.queryDefinitionModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<QueryDefinitionRecord | null> {
    const doc = await this.queryDefinitionModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateQueryDefinitionRecord,
  ): Promise<QueryDefinitionRecord | null> {
    const doc = await this.queryDefinitionModel.findOneAndUpdate(
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
  ): Promise<QueryDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: QueryDefinitionStatus.Archived,
      updatedBy,
    });
  }

  private toMongoFilters(filters: QueryDefinitionFilters): FilterQuery<QueryDefinitionDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.datasetId ? { datasetId: new Types.ObjectId(filters.datasetId) } : {}),
      ...(filters.queryKey ? { queryKey: filters.queryKey } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };
  }

  private toMongoUpdate(record: UpdateQueryDefinitionRecord): Record<string, unknown> {
    const { datasetId, ...rest } = record;

    return {
      ...rest,
      ...(datasetId !== undefined ? { datasetId: new Types.ObjectId(datasetId) } : {}),
    };
  }
}
