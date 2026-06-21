import { Injectable } from '@nestjs/common';

import {
  isSensitiveMetadataValue,
  SanitizedMetadataValue,
} from '../../../core/utils/sanitize-metadata';
import { QueryDefinitionFilterDto } from '../dto/query-definition-filter.dto';
import {
  QueryDefinitionDimension,
  QueryDefinitionFilter,
  QueryDefinitionMetric,
  QueryDefinitionSort,
} from '../schemas/query-definition.constants';
import { QueryDefinitionDimensionDto } from '../dto/query-definition-dimension.dto';
import { QueryDefinitionMetricDto } from '../dto/query-definition-metric.dto';
import { QueryDefinitionSortDto } from '../dto/query-definition-sort.dto';

@Injectable()
export class QueryDefinitionSanitizerService {
  sanitizeMetrics(metrics?: QueryDefinitionMetricDto[]): QueryDefinitionMetric[] {
    return (metrics ?? []).map((metric) => ({
      key: metric.key,
      label: metric.label,
      field: metric.field,
      aggregation: metric.aggregation,
      format: metric.format,
      description: metric.description,
    }));
  }

  sanitizeDimensions(dimensions?: QueryDefinitionDimensionDto[]): QueryDefinitionDimension[] {
    return (dimensions ?? []).map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      field: dimension.field,
      type: dimension.type,
      description: dimension.description,
    }));
  }

  sanitizeFilters(filters?: QueryDefinitionFilterDto[]): QueryDefinitionFilter[] {
    return (filters ?? []).map((filter) => ({
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required ?? false,
      defaultValue: this.sanitizeValue(filter.defaultValue),
      allowedValues: this.sanitizeValues(filter.allowedValues),
    }));
  }

  sanitizeSorts(sorts?: QueryDefinitionSortDto[]): QueryDefinitionSort[] {
    return (sorts ?? []).map((sort) => ({
      field: sort.field,
      direction: sort.direction,
    }));
  }

  private sanitizeValues(values?: unknown[]): SanitizedMetadataValue[] {
    return (values ?? []).flatMap((value) => {
      const sanitized = this.sanitizeValue(value);

      return sanitized === undefined ? [] : [sanitized];
    });
  }

  private sanitizeValue(value: unknown): SanitizedMetadataValue | undefined {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    if (isSensitiveMetadataValue(value)) {
      return undefined;
    }

    return value.slice(0, 500);
  }
}
