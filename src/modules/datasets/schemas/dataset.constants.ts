// Domain enums and field types for the datasets module. Mongoose schema removed in P5 (ADR-0035).

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

export interface DatasetField {
  key: string;
  label: string;
  type: DatasetFieldType;
  required: boolean;
  description?: string;
  sampleMasked?: string;
  semanticRole?: DatasetFieldSemanticRole;
}
