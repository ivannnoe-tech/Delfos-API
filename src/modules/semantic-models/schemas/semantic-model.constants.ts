// Domain enums for the semantic-models module. Mongoose schema removed in P5 (ADR-0035).
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

/**
 * Persistence-neutral shapes for the semantic-model embedded subdocuments.
 * These were Mongoose `@Schema` sub-classes before P5; they are now plain
 * interfaces so repositories and services keep their existing imports while the
 * data lives in PostgreSQL JSONB columns (ADR-0035 / ADR-0036).
 */
export interface SemanticModelQuality {
  score?: number;
  level?: SemanticQualityLevel;
  warnings: string[];
}

export interface SemanticMeasure {
  key: string;
  name: string;
  description?: string;
  aggregation: SemanticMeasureAggregation;
  semanticType?: SemanticType;
  datasetKey?: string;
  fieldKey?: string;
  unit?: string;
  formatHint?: string;
  status: SemanticModelStatus;
  owner?: string;
  tags: string[];
  isReusable: boolean;
  warnings: string[];
  metadata: SanitizedMetadata;
}

export interface SemanticDimension {
  key: string;
  name: string;
  description?: string;
  semanticType?: SemanticType;
  domain: SemanticDimensionDomain;
  datasetKey?: string;
  fieldKey?: string;
  cardinalityHint?: SemanticCardinalityHint;
  status: SemanticModelStatus;
  owner?: string;
  tags: string[];
  warnings: string[];
  metadata: SanitizedMetadata;
}

export interface SemanticGlossaryTerm {
  key: string;
  name: string;
  description?: string;
  aliases: string[];
  domain?: SemanticDimensionDomain;
  relatedMeasureKeys: string[];
  relatedDimensionKeys: string[];
  status: SemanticModelStatus;
  owner?: string;
  tags: string[];
  metadata: SanitizedMetadata;
}
