// Domain enums for the query-definitions module. Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.
import { SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';

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

export interface QueryDefinitionMetric {
  key: string;
  label: string;
  field: string;
  aggregation: QueryDefinitionAggregation;
  format?: string;
  description?: string;
}

export interface QueryDefinitionDimension {
  key: string;
  label: string;
  field: string;
  type: QueryDefinitionDimensionType;
  description?: string;
}

export interface QueryDefinitionFilter {
  key: string;
  label: string;
  field: string;
  operator: QueryDefinitionFilterOperator;
  required: boolean;
  defaultValue?: SanitizedMetadataValue;
  allowedValues: SanitizedMetadataValue[];
}

export interface QueryDefinitionSort {
  field: string;
  direction: QueryDefinitionSortDirection;
}
