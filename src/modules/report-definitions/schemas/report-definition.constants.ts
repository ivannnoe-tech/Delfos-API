// Domain enums for the report-definitions module. Mongoose schema removed in P5 (ADR-0035).
import { SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

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

/**
 * Persistence-neutral layout shape for a report definition. Plain structural
 * type (no Mongoose); both backends map their stored layout onto it.
 */
export interface ReportDefinitionLayout {
  type: ReportDefinitionLayoutType;
  columns?: number;
  density?: ReportDefinitionLayoutDensity;
}

/**
 * Persistence-neutral section shape for a report definition. Plain structural
 * type (no Mongoose); both backends map their stored sections onto it.
 */
export interface ReportDefinitionSection {
  key: string;
  title: string;
  description?: string;
  order: number;
  layout?: ReportDefinitionLayout;
}

/**
 * Persistence-neutral filter shape for a report definition. Plain structural
 * type (no Mongoose); both backends map their stored filters onto it.
 */
export interface ReportDefinitionFilter {
  key: string;
  label: string;
  field: string;
  operator: ReportDefinitionFilterOperator;
  required: boolean;
  defaultValue?: SanitizedMetadataValue;
  allowedValues: SanitizedMetadataValue[];
}

/**
 * Persistence-neutral parameter shape for a report definition. Plain structural
 * type (no Mongoose); both backends map their stored parameters onto it.
 */
export interface ReportDefinitionParameter {
  key: string;
  label: string;
  type: ReportDefinitionParameterType;
  required: boolean;
  defaultValue?: SanitizedMetadataValue;
  allowedValues: SanitizedMetadataValue[];
}
