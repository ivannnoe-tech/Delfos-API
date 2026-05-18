import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

export enum SemanticModelStatus {
  Draft = 'draft',
  Review = 'review',
  Verified = 'verified',
  Certified = 'certified',
  Deprecated = 'deprecated',
  Archived = 'archived',
}

export enum SemanticType {
  Currency = 'currency',
  Percentage = 'percentage',
  Date = 'date',
  Datetime = 'datetime',
  Customer = 'customer',
  Product = 'product',
  Category = 'category',
  City = 'city',
  Region = 'region',
  Status = 'status',
  Identifier = 'identifier',
  Email = 'email',
  Phone = 'phone',
  Quantity = 'quantity',
  Score = 'score',
  Boolean = 'boolean',
  Url = 'url',
  Document = 'document',
  Unknown = 'unknown',
}

export enum SemanticMeasureAggregation {
  Sum = 'sum',
  Avg = 'avg',
  Count = 'count',
  Min = 'min',
  Max = 'max',
  CalculatedFuture = 'calculated_future',
}

export enum SemanticDimensionDomain {
  Time = 'time',
  Geography = 'geography',
  Customer = 'customer',
  Product = 'product',
  Financial = 'financial',
  Operational = 'operational',
  System = 'system',
  Custom = 'custom',
}

export enum SemanticCardinalityHint {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Unknown = 'unknown',
}

export enum SemanticQualityLevel {
  Weak = 'weak',
  Fair = 'fair',
  Good = 'good',
  Strong = 'strong',
}

@Schema({ _id: false })
export class SemanticModelQuality {
  @Prop({ min: 0, max: 100 })
  score?: number;

  @Prop({ enum: SemanticQualityLevel })
  level?: SemanticQualityLevel;

  @Prop({ type: [String], default: [] })
  warnings!: string[];
}

export const SemanticModelQualitySchema = SchemaFactory.createForClass(SemanticModelQuality);

@Schema({ _id: false })
export class SemanticMeasure {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ required: true, enum: SemanticMeasureAggregation })
  aggregation!: SemanticMeasureAggregation;

  @Prop({ enum: SemanticType })
  semanticType?: SemanticType;

  @Prop({ trim: true, maxlength: 80 })
  datasetKey?: string;

  @Prop({ trim: true, maxlength: 160 })
  fieldKey?: string;

  @Prop({ trim: true, maxlength: 40 })
  unit?: string;

  @Prop({ trim: true, maxlength: 80 })
  formatHint?: string;

  @Prop({
    required: true,
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  status!: SemanticModelStatus;

  @Prop({ trim: true, maxlength: 128 })
  owner?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  isReusable!: boolean;

  @Prop({ type: [String], default: [] })
  warnings!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;
}

export const SemanticMeasureSchema = SchemaFactory.createForClass(SemanticMeasure);

@Schema({ _id: false })
export class SemanticDimension {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ enum: SemanticType })
  semanticType?: SemanticType;

  @Prop({ required: true, enum: SemanticDimensionDomain })
  domain!: SemanticDimensionDomain;

  @Prop({ trim: true, maxlength: 80 })
  datasetKey?: string;

  @Prop({ trim: true, maxlength: 160 })
  fieldKey?: string;

  @Prop({ enum: SemanticCardinalityHint })
  cardinalityHint?: SemanticCardinalityHint;

  @Prop({
    required: true,
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  status!: SemanticModelStatus;

  @Prop({ trim: true, maxlength: 128 })
  owner?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  warnings!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;
}

export const SemanticDimensionSchema = SchemaFactory.createForClass(SemanticDimension);

@Schema({ _id: false })
export class SemanticGlossaryTerm {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: [String], default: [] })
  aliases!: string[];

  @Prop({ enum: SemanticDimensionDomain })
  domain?: SemanticDimensionDomain;

  @Prop({ type: [String], default: [] })
  relatedMeasureKeys!: string[];

  @Prop({ type: [String], default: [] })
  relatedDimensionKeys!: string[];

  @Prop({
    required: true,
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  status!: SemanticModelStatus;

  @Prop({ trim: true, maxlength: 128 })
  owner?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;
}

export const SemanticGlossaryTermSchema = SchemaFactory.createForClass(SemanticGlossaryTerm);

@Schema({ collection: 'semantic_models', timestamps: true })
export class SemanticModel {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  modelKey!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({
    required: true,
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  status!: SemanticModelStatus;

  @Prop({ type: [String], default: [] })
  datasetKeys!: string[];

  @Prop({ trim: true, maxlength: 128 })
  owner?: string;

  @Prop({ trim: true, maxlength: 128 })
  steward?: string;

  @Prop({ trim: true, maxlength: 128 })
  certificationOwner?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: SemanticModelQualitySchema, default: () => ({}) })
  quality!: SemanticModelQuality;

  @Prop({ type: [SemanticMeasureSchema], default: [] })
  measures!: SemanticMeasure[];

  @Prop({ type: [SemanticDimensionSchema], default: [] })
  dimensions!: SemanticDimension[];

  @Prop({ type: [SemanticGlossaryTermSchema], default: [] })
  glossaryTerms!: SemanticGlossaryTerm[];

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

export type SemanticModelDocument = HydratedDocument<SemanticModel> & {
  _id: Types.ObjectId;
};

export const SemanticModelSchema = SchemaFactory.createForClass(SemanticModel);

SemanticModelSchema.index({ tenantId: 1, modelKey: 1 }, { unique: true });
SemanticModelSchema.index({ tenantId: 1, status: 1 });
