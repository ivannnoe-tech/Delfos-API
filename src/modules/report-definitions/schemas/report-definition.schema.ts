import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata, SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

export enum ReportDefinitionBlockType {
  Text = 'text',
  Table = 'table',
  Chart = 'chart',
  Metric = 'metric',
  DashboardWidget = 'dashboard_widget',
  Custom = 'custom',
}

export enum ReportDefinitionFilterOperator {
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

export enum ReportDefinitionLayoutDensity {
  Compact = 'compact',
  Comfortable = 'comfortable',
  Spacious = 'spacious',
}

export enum ReportDefinitionLayoutType {
  Paged = 'paged',
  Sections = 'sections',
  Table = 'table',
  Custom = 'custom',
}

export enum ReportDefinitionParameterType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  DateRange = 'date_range',
  Select = 'select',
}

export enum ReportDefinitionStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
}

export enum ReportDefinitionVisibility {
  Private = 'private',
  Tenant = 'tenant',
}

@Schema({ _id: false })
export class ReportDefinitionLayout {
  @Prop({
    required: true,
    enum: ReportDefinitionLayoutType,
    default: ReportDefinitionLayoutType.Paged,
  })
  type!: ReportDefinitionLayoutType;

  @Prop({ min: 1, max: 24 })
  columns?: number;

  @Prop({ enum: ReportDefinitionLayoutDensity })
  density?: ReportDefinitionLayoutDensity;
}

export const ReportDefinitionLayoutSchema = SchemaFactory.createForClass(ReportDefinitionLayout);

@Schema({ _id: false })
export class ReportDefinitionSection {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ required: true, min: 0, max: 1000 })
  order!: number;

  @Prop({ type: ReportDefinitionLayoutSchema })
  layout?: ReportDefinitionLayout;
}

export const ReportDefinitionSectionSchema = SchemaFactory.createForClass(ReportDefinitionSection);

@Schema({ _id: false })
export class ReportDefinitionBlock {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ required: true, enum: ReportDefinitionBlockType })
  type!: ReportDefinitionBlockType;

  @Prop({ type: Types.ObjectId, ref: 'QueryDefinition' })
  queryDefinitionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DashboardDefinition' })
  dashboardDefinitionId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 80 })
  sectionKey?: string;

  @Prop({ required: true, min: 0, max: 1000 })
  order!: number;

  @Prop({ type: Object, default: {} })
  options!: SanitizedMetadata;
}

export const ReportDefinitionBlockSchema = SchemaFactory.createForClass(ReportDefinitionBlock);

@Schema({ _id: false })
export class ReportDefinitionFilter {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({ required: true, enum: ReportDefinitionFilterOperator })
  operator!: ReportDefinitionFilterOperator;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ type: Object })
  defaultValue?: SanitizedMetadataValue;

  @Prop({ type: [Object], default: [] })
  allowedValues!: SanitizedMetadataValue[];
}

export const ReportDefinitionFilterSchema = SchemaFactory.createForClass(ReportDefinitionFilter);

@Schema({ _id: false })
export class ReportDefinitionParameter {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, enum: ReportDefinitionParameterType })
  type!: ReportDefinitionParameterType;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ type: Object })
  defaultValue?: SanitizedMetadataValue;

  @Prop({ type: [Object], default: [] })
  allowedValues!: SanitizedMetadataValue[];
}

export const ReportDefinitionParameterSchema =
  SchemaFactory.createForClass(ReportDefinitionParameter);

@Schema({ collection: 'report_definitions', timestamps: true })
export class ReportDefinition {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  reportKey!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true, enum: ReportDefinitionStatus, default: ReportDefinitionStatus.Draft })
  status!: ReportDefinitionStatus;

  @Prop({
    required: true,
    enum: ReportDefinitionVisibility,
    default: ReportDefinitionVisibility.Tenant,
  })
  visibility!: ReportDefinitionVisibility;

  @Prop({ type: Types.ObjectId, ref: 'QueryDefinition' })
  queryDefinitionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DashboardDefinition' })
  dashboardDefinitionId?: Types.ObjectId;

  @Prop({ type: ReportDefinitionLayoutSchema, default: () => ({}) })
  layout!: ReportDefinitionLayout;

  @Prop({ type: [ReportDefinitionSectionSchema], default: [] })
  sections!: ReportDefinitionSection[];

  @Prop({ type: [ReportDefinitionBlockSchema], default: [] })
  blocks!: ReportDefinitionBlock[];

  @Prop({ type: [ReportDefinitionFilterSchema], default: [] })
  filters!: ReportDefinitionFilter[];

  @Prop({ type: [ReportDefinitionParameterSchema], default: [] })
  parameters!: ReportDefinitionParameter[];

  @Prop({ type: Object, default: {} })
  exportOptions!: SanitizedMetadata;

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

export type ReportDefinitionDocument = HydratedDocument<ReportDefinition> & {
  _id: Types.ObjectId;
};

export const ReportDefinitionSchema = SchemaFactory.createForClass(ReportDefinition);

ReportDefinitionSchema.index({ tenantId: 1, reportKey: 1 }, { unique: true });
ReportDefinitionSchema.index({ tenantId: 1, status: 1 });
ReportDefinitionSchema.index({ tenantId: 1, visibility: 1 });
ReportDefinitionSchema.index({ tenantId: 1, queryDefinitionId: 1 });
ReportDefinitionSchema.index({ tenantId: 1, dashboardDefinitionId: 1 });
