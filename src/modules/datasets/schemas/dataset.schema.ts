import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

export enum DatasetFieldSemanticRole {
  Dimension = 'dimension',
  Metric = 'metric',
  Identifier = 'identifier',
  Timestamp = 'timestamp',
  Attribute = 'attribute',
}

export enum DatasetFieldType {
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

export enum DatasetRefreshMode {
  Manual = 'manual',
  Scheduled = 'scheduled',
  Realtime = 'realtime',
  None = 'none',
}

export enum DatasetSchemaMode {
  Declared = 'declared',
  Inferred = 'inferred',
  Dynamic = 'dynamic',
}

export enum DatasetSourceType {
  Api = 'api',
  Database = 'database',
  File = 'file',
  Manual = 'manual',
  Computed = 'computed',
  Custom = 'custom',
}

export enum DatasetStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
  Archived = 'archived',
}

@Schema({ _id: false })
export class DatasetField {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, enum: DatasetFieldType })
  type!: DatasetFieldType;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ trim: true, maxlength: 240 })
  description?: string;

  @Prop({ trim: true, maxlength: 120 })
  sampleMasked?: string;

  @Prop({ enum: DatasetFieldSemanticRole })
  semanticRole?: DatasetFieldSemanticRole;
}

export const DatasetFieldSchema = SchemaFactory.createForClass(DatasetField);

@Schema({ collection: 'datasets', timestamps: true })
export class Dataset {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Connection' })
  connectionId?: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  datasetKey!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true, enum: DatasetSourceType, default: DatasetSourceType.Api })
  sourceType!: DatasetSourceType;

  @Prop({ required: true, enum: DatasetStatus, default: DatasetStatus.Draft })
  status!: DatasetStatus;

  @Prop({ required: true, enum: DatasetRefreshMode, default: DatasetRefreshMode.Manual })
  refreshMode!: DatasetRefreshMode;

  @Prop({ required: true, enum: DatasetSchemaMode, default: DatasetSchemaMode.Declared })
  schemaMode!: DatasetSchemaMode;

  @Prop({ type: [DatasetFieldSchema], default: [] })
  fields!: DatasetField[];

  @Prop({ type: [String], default: [] })
  primaryKeyFields!: string[];

  @Prop({ trim: true, maxlength: 80 })
  timeField?: string;

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

export type DatasetDocument = HydratedDocument<Dataset> & { _id: Types.ObjectId };

export const DatasetSchema = SchemaFactory.createForClass(Dataset);

DatasetSchema.index({ tenantId: 1, datasetKey: 1 }, { unique: true });
DatasetSchema.index({ tenantId: 1, connectionId: 1 });
DatasetSchema.index({ tenantId: 1, status: 1 });
DatasetSchema.index({ tenantId: 1, sourceType: 1 });
