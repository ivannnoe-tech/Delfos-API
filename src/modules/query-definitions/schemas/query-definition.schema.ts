import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata, SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

export enum QueryDefinitionAggregation {
  Count = 'count',
  CountDistinct = 'count_distinct',
  Sum = 'sum',
  Avg = 'avg',
  Min = 'min',
  Max = 'max',
  None = 'none',
}

export enum QueryDefinitionDimensionType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  Datetime = 'datetime',
  Currency = 'currency',
  Percentage = 'percentage',
  Object = 'object',
  Array = 'array',
  Unknown = 'unknown',
}

export enum QueryDefinitionFilterOperator {
  Eq = 'eq',
  Neq = 'neq',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
  In = 'in',
  NotIn = 'not_in',
  Contains = 'contains',
  Between = 'between',
  DateRange = 'date_range',
}

export enum QueryDefinitionSortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum QueryDefinitionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
  Archived = 'archived',
}

export enum QueryDefinitionTimeGranularity {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

export enum QueryDefinitionType {
  Table = 'table',
  Metric = 'metric',
  Timeseries = 'timeseries',
  Comparison = 'comparison',
  Custom = 'custom',
}

@Schema({ _id: false })
export class QueryDefinitionMetric {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({
    required: true,
    enum: QueryDefinitionAggregation,
    default: QueryDefinitionAggregation.None,
  })
  aggregation!: QueryDefinitionAggregation;

  @Prop({ trim: true, maxlength: 80 })
  format?: string;

  @Prop({ trim: true, maxlength: 240 })
  description?: string;
}

export const QueryDefinitionMetricSchema = SchemaFactory.createForClass(QueryDefinitionMetric);

@Schema({ _id: false })
export class QueryDefinitionDimension {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({ required: true, enum: QueryDefinitionDimensionType })
  type!: QueryDefinitionDimensionType;

  @Prop({ trim: true, maxlength: 240 })
  description?: string;
}

export const QueryDefinitionDimensionSchema =
  SchemaFactory.createForClass(QueryDefinitionDimension);

@Schema({ _id: false })
export class QueryDefinitionFilter {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({ required: true, enum: QueryDefinitionFilterOperator })
  operator!: QueryDefinitionFilterOperator;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ type: Object })
  defaultValue?: SanitizedMetadataValue;

  @Prop({ type: [Object], default: [] })
  allowedValues!: SanitizedMetadataValue[];
}

export const QueryDefinitionFilterSchema = SchemaFactory.createForClass(QueryDefinitionFilter);

@Schema({ _id: false })
export class QueryDefinitionSort {
  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({ required: true, enum: QueryDefinitionSortDirection })
  direction!: QueryDefinitionSortDirection;
}

export const QueryDefinitionSortSchema = SchemaFactory.createForClass(QueryDefinitionSort);

@Schema({ collection: 'query_definitions', timestamps: true })
export class QueryDefinition {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Dataset' })
  datasetId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  queryKey!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true, enum: QueryDefinitionStatus, default: QueryDefinitionStatus.Draft })
  status!: QueryDefinitionStatus;

  @Prop({ required: true, enum: QueryDefinitionType, default: QueryDefinitionType.Table })
  type!: QueryDefinitionType;

  @Prop({ type: [QueryDefinitionMetricSchema], default: [] })
  metrics!: QueryDefinitionMetric[];

  @Prop({ type: [QueryDefinitionDimensionSchema], default: [] })
  dimensions!: QueryDefinitionDimension[];

  @Prop({ type: [QueryDefinitionFilterSchema], default: [] })
  filters!: QueryDefinitionFilter[];

  @Prop({ type: [QueryDefinitionSortSchema], default: [] })
  sorts!: QueryDefinitionSort[];

  @Prop({ min: 1, max: 1000 })
  defaultLimit?: number;

  @Prop({ trim: true, maxlength: 160 })
  timeField?: string;

  @Prop({ type: [String], enum: QueryDefinitionTimeGranularity, default: [] })
  allowedGranularities!: QueryDefinitionTimeGranularity[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;

  @Prop({ type: Object, default: {} })
  settings!: SanitizedMetadata;

  @Prop({ trim: true, maxlength: 128 })
  createdBy?: string;

  @Prop({ trim: true, maxlength: 128 })
  updatedBy?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type QueryDefinitionDocument = HydratedDocument<QueryDefinition> & {
  _id: Types.ObjectId;
};

export const QueryDefinitionSchema = SchemaFactory.createForClass(QueryDefinition);

QueryDefinitionSchema.index({ tenantId: 1, queryKey: 1 }, { unique: true });
QueryDefinitionSchema.index({ tenantId: 1, datasetId: 1 });
QueryDefinitionSchema.index({ tenantId: 1, status: 1 });
QueryDefinitionSchema.index({ tenantId: 1, type: 1 });
