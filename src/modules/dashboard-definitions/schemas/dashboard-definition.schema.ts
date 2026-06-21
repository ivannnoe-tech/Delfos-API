// Domain enums for the dashboard-definitions module. Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.
import { SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

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

export interface DashboardDefinitionLayout {
  type: DashboardDefinitionLayoutType;
  columns?: number;
  gap?: DashboardDefinitionLayoutGap;
  density?: DashboardDefinitionLayoutDensity;
}

export interface DashboardDefinitionSection {
  key: string;
  title: string;
  description?: string;
  order: number;
  layout?: DashboardDefinitionLayout;
}

export interface DashboardDefinitionWidgetSize {
  cols: number;
  rows: number;
}

export interface DashboardDefinitionWidgetPosition {
  x: number;
  y: number;
}

export interface DashboardDefinitionVisualization {
  chartType?: DashboardDefinitionChartType;
  xField?: string;
  yFields: string[];
  groupBy?: string;
  format?: string;
}

export interface DashboardDefinitionFilter {
  key: string;
  label: string;
  field: string;
  operator: DashboardDefinitionFilterOperator;
  required: boolean;
  defaultValue?: SanitizedMetadataValue;
  allowedValues: SanitizedMetadataValue[];
}
