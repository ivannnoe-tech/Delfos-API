import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata, SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

export enum DashboardDefinitionChartType {
  Line = 'line',
  Bar = 'bar',
  Area = 'area',
  Pie = 'pie',
  Donut = 'donut',
  Scatter = 'scatter',
  StackedBar = 'stacked_bar',
  Table = 'table',
  Number = 'number',
  Custom = 'custom',
}

export enum DashboardDefinitionFilterOperator {
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

export enum DashboardDefinitionLayoutDensity {
  Compact = 'compact',
  Comfortable = 'comfortable',
  Spacious = 'spacious',
}

export enum DashboardDefinitionLayoutGap {
  None = 'none',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum DashboardDefinitionLayoutType {
  Grid = 'grid',
  Tabs = 'tabs',
  List = 'list',
  Custom = 'custom',
}

export enum DashboardDefinitionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
  Archived = 'archived',
}

export enum DashboardDefinitionVisibility {
  Private = 'private',
  Tenant = 'tenant',
  Public = 'public',
}

export enum DashboardDefinitionWidgetType {
  MetricCard = 'metric_card',
  Chart = 'chart',
  Table = 'table',
  Text = 'text',
  Filter = 'filter',
  Custom = 'custom',
}

@Schema({ _id: false })
export class DashboardDefinitionLayout {
  @Prop({
    required: true,
    enum: DashboardDefinitionLayoutType,
    default: DashboardDefinitionLayoutType.Grid,
  })
  type!: DashboardDefinitionLayoutType;

  @Prop({ min: 1, max: 24 })
  columns?: number;

  @Prop({ enum: DashboardDefinitionLayoutGap })
  gap?: DashboardDefinitionLayoutGap;

  @Prop({ enum: DashboardDefinitionLayoutDensity })
  density?: DashboardDefinitionLayoutDensity;
}

export const DashboardDefinitionLayoutSchema =
  SchemaFactory.createForClass(DashboardDefinitionLayout);

@Schema({ _id: false })
export class DashboardDefinitionSection {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ required: true, min: 0, max: 1000 })
  order!: number;

  @Prop({ type: DashboardDefinitionLayoutSchema })
  layout?: DashboardDefinitionLayout;
}

export const DashboardDefinitionSectionSchema = SchemaFactory.createForClass(
  DashboardDefinitionSection,
);

@Schema({ _id: false })
export class DashboardDefinitionWidgetSize {
  @Prop({ required: true, min: 1, max: 24 })
  cols!: number;

  @Prop({ required: true, min: 1, max: 24 })
  rows!: number;
}

export const DashboardDefinitionWidgetSizeSchema = SchemaFactory.createForClass(
  DashboardDefinitionWidgetSize,
);

@Schema({ _id: false })
export class DashboardDefinitionWidgetPosition {
  @Prop({ required: true, min: 0, max: 1000 })
  x!: number;

  @Prop({ required: true, min: 0, max: 1000 })
  y!: number;
}

export const DashboardDefinitionWidgetPositionSchema = SchemaFactory.createForClass(
  DashboardDefinitionWidgetPosition,
);

@Schema({ _id: false })
export class DashboardDefinitionVisualization {
  @Prop({ enum: DashboardDefinitionChartType })
  chartType?: DashboardDefinitionChartType;

  @Prop({ trim: true, maxlength: 160 })
  xField?: string;

  @Prop({ type: [String], default: [] })
  yFields!: string[];

  @Prop({ trim: true, maxlength: 160 })
  groupBy?: string;

  @Prop({ trim: true, maxlength: 80 })
  format?: string;
}

export const DashboardDefinitionVisualizationSchema = SchemaFactory.createForClass(
  DashboardDefinitionVisualization,
);

@Schema({ _id: false })
export class DashboardDefinitionWidget {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ required: true, enum: DashboardDefinitionWidgetType })
  type!: DashboardDefinitionWidgetType;

  @Prop({ type: Types.ObjectId, ref: 'QueryDefinition' })
  queryDefinitionId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 80 })
  sectionKey?: string;

  @Prop({ required: true, min: 0, max: 1000 })
  order!: number;

  @Prop({ type: DashboardDefinitionWidgetSizeSchema })
  size?: DashboardDefinitionWidgetSize;

  @Prop({ type: DashboardDefinitionWidgetPositionSchema })
  position?: DashboardDefinitionWidgetPosition;

  @Prop({ type: DashboardDefinitionVisualizationSchema })
  visualization?: DashboardDefinitionVisualization;

  @Prop({ type: Object, default: {} })
  options!: SanitizedMetadata;
}

export const DashboardDefinitionWidgetSchema =
  SchemaFactory.createForClass(DashboardDefinitionWidget);

@Schema({ _id: false })
export class DashboardDefinitionFilter {
  @Prop({ required: true, trim: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  field!: string;

  @Prop({ required: true, enum: DashboardDefinitionFilterOperator })
  operator!: DashboardDefinitionFilterOperator;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ type: Object })
  defaultValue?: SanitizedMetadataValue;

  @Prop({ type: [Object], default: [] })
  allowedValues!: SanitizedMetadataValue[];
}

export const DashboardDefinitionFilterSchema =
  SchemaFactory.createForClass(DashboardDefinitionFilter);

@Schema({ collection: 'dashboard_definitions', timestamps: true })
export class DashboardDefinition {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  dashboardKey!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({
    required: true,
    enum: DashboardDefinitionStatus,
    default: DashboardDefinitionStatus.Draft,
  })
  status!: DashboardDefinitionStatus;

  @Prop({
    required: true,
    enum: DashboardDefinitionVisibility,
    default: DashboardDefinitionVisibility.Tenant,
  })
  visibility!: DashboardDefinitionVisibility;

  @Prop({ type: DashboardDefinitionLayoutSchema, default: () => ({}) })
  layout!: DashboardDefinitionLayout;

  @Prop({ type: [DashboardDefinitionSectionSchema], default: [] })
  sections!: DashboardDefinitionSection[];

  @Prop({ type: [DashboardDefinitionWidgetSchema], default: [] })
  widgets!: DashboardDefinitionWidget[];

  @Prop({ type: [DashboardDefinitionFilterSchema], default: [] })
  filters!: DashboardDefinitionFilter[];

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

export type DashboardDefinitionDocument = HydratedDocument<DashboardDefinition> & {
  _id: Types.ObjectId;
};

export const DashboardDefinitionSchema = SchemaFactory.createForClass(DashboardDefinition);

DashboardDefinitionSchema.index({ tenantId: 1, dashboardKey: 1 }, { unique: true });
DashboardDefinitionSchema.index({ tenantId: 1, status: 1 });
DashboardDefinitionSchema.index({ tenantId: 1, visibility: 1 });
