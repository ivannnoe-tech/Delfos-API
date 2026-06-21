import { Injectable } from '@nestjs/common';

import {
  QueryDefinitionDimensionResponseDto,
  QueryDefinitionMetricResponseDto,
  QueryDefinitionResponseDto,
} from '../../query-definitions/dto/query-definition-response.dto';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionType,
} from '../../query-definitions/schemas/query-definition.constants';
import {
  ExecutionPreviewColumnType,
  ExecutionPreviewMode,
  QueryPreviewColumnDto,
  QueryPreviewResultDto,
  QueryPreviewRow,
} from '../dto/query-preview-response.dto';

export interface DemoQueryPreviewOptions {
  generatedAt?: Date;
  rowLimit?: number;
}

@Injectable()
export class DemoQueryPreviewGeneratorService {
  generate(
    queryDefinition: QueryDefinitionResponseDto,
    options: DemoQueryPreviewOptions = {},
  ): QueryPreviewResultDto {
    const generatedAt = options.generatedAt ?? new Date();
    const columns = this.inferColumns(queryDefinition);
    const rowCount = this.resolveRowCount(queryDefinition, options.rowLimit);
    const seed = this.createSeed(queryDefinition);
    const rows = Array.from({ length: rowCount }, (_, index) =>
      this.generateRow(queryDefinition, columns, seed, index),
    );

    return {
      mode: ExecutionPreviewMode.Demo,
      queryDefinitionId: queryDefinition.id,
      queryKey: queryDefinition.queryKey,
      generatedAt: generatedAt.toISOString(),
      columns,
      rows,
      meta: {
        rowCount: rows.length,
        isPreview: true,
        source: 'demo-generator',
      },
    };
  }

  private inferColumns(queryDefinition: QueryDefinitionResponseDto): QueryPreviewColumnDto[] {
    const dimensionColumns = this.inferDimensionColumns(queryDefinition);
    const metricColumns = this.inferMetricColumns(queryDefinition);

    return [...dimensionColumns, ...metricColumns];
  }

  private inferDimensionColumns(
    queryDefinition: QueryDefinitionResponseDto,
  ): QueryPreviewColumnDto[] {
    if (queryDefinition.dimensions.length > 0) {
      return queryDefinition.dimensions.map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        type: this.toColumnTypeFromDimension(dimension.type),
      }));
    }

    if (queryDefinition.type === QueryDefinitionType.Timeseries || queryDefinition.timeField) {
      return [
        {
          key: 'period',
          label: 'Periodo',
          type: ExecutionPreviewColumnType.String,
        },
      ];
    }

    if (queryDefinition.type === QueryDefinitionType.Table) {
      return [
        {
          key: 'demo_item',
          label: 'Item demo',
          type: ExecutionPreviewColumnType.String,
        },
      ];
    }

    return [];
  }

  private inferMetricColumns(queryDefinition: QueryDefinitionResponseDto): QueryPreviewColumnDto[] {
    if (queryDefinition.metrics.length > 0) {
      return queryDefinition.metrics.map((metric) => ({
        key: metric.key,
        label: metric.label,
        type: this.toColumnTypeFromMetric(metric),
      }));
    }

    return [
      {
        key: 'demo_value',
        label: 'Valor demo',
        type: ExecutionPreviewColumnType.Number,
      },
    ];
  }

  private resolveRowCount(
    queryDefinition: QueryDefinitionResponseDto,
    requestedLimit?: number,
  ): number {
    const limit = this.clamp(requestedLimit ?? queryDefinition.defaultLimit ?? 6, 1, 12);

    if (
      queryDefinition.type === QueryDefinitionType.Metric &&
      queryDefinition.dimensions.length === 0
    ) {
      return 1;
    }

    if (queryDefinition.type === QueryDefinitionType.Timeseries) {
      return limit;
    }

    return Math.min(limit, 6);
  }

  private generateRow(
    queryDefinition: QueryDefinitionResponseDto,
    columns: QueryPreviewColumnDto[],
    seed: number,
    rowIndex: number,
  ): QueryPreviewRow {
    return columns.reduce<QueryPreviewRow>((row, column) => {
      const metric = queryDefinition.metrics.find((candidate) => candidate.key === column.key);
      const dimension = queryDefinition.dimensions.find(
        (candidate) => candidate.key === column.key,
      );

      row[column.key] = metric
        ? this.generateMetricValue(metric, seed, rowIndex)
        : this.generateDimensionValue(column, dimension, seed, rowIndex);

      return row;
    }, {});
  }

  private generateMetricValue(
    metric: QueryDefinitionMetricResponseDto,
    seed: number,
    rowIndex: number,
  ): number {
    const metricSeed = seed + this.hashText(metric.key);
    const normalizedFormat = (metric.format ?? '').toLowerCase();

    if (normalizedFormat.includes('percentage') || normalizedFormat.includes('percent')) {
      return Number((0.12 + (metricSeed % 25) / 100 + rowIndex * 0.015).toFixed(4));
    }

    if (normalizedFormat.includes('currency') || normalizedFormat.includes('money')) {
      return 50000 + (metricSeed % 20000) + rowIndex * 7500;
    }

    if (
      metric.aggregation === QueryDefinitionAggregation.Count ||
      metric.aggregation === QueryDefinitionAggregation.CountDistinct
    ) {
      return 20 + (metricSeed % 90) + rowIndex * 7;
    }

    if (metric.aggregation === QueryDefinitionAggregation.Avg) {
      return Number((100 + (metricSeed % 75) + rowIndex * 3.5).toFixed(2));
    }

    return 1000 + (metricSeed % 9000) + rowIndex * 350;
  }

  private generateDimensionValue(
    column: QueryPreviewColumnDto,
    dimension: QueryDefinitionDimensionResponseDto | undefined,
    seed: number,
    rowIndex: number,
  ): string | number | boolean {
    if (column.key === 'period') {
      return this.demoPeriod(rowIndex);
    }

    const dimensionType = dimension?.type;

    if (dimensionType === QueryDefinitionDimensionType.Boolean) {
      return rowIndex % 2 === 0;
    }

    if (
      dimensionType === QueryDefinitionDimensionType.Number ||
      dimensionType === QueryDefinitionDimensionType.Currency
    ) {
      return 10 + ((seed + rowIndex * 11) % 90);
    }

    if (dimensionType === QueryDefinitionDimensionType.Percentage) {
      return Number((0.1 + ((seed + rowIndex) % 40) / 100).toFixed(4));
    }

    if (
      dimensionType === QueryDefinitionDimensionType.Date ||
      dimensionType === QueryDefinitionDimensionType.Datetime
    ) {
      return `2026-${String((rowIndex % 12) + 1).padStart(2, '0')}-01`;
    }

    return this.demoLabel(column, rowIndex);
  }

  private demoPeriod(rowIndex: number): string {
    const periods = [
      'Jan demo',
      'Feb demo',
      'Mar demo',
      'Apr demo',
      'May demo',
      'Jun demo',
      'Jul demo',
      'Aug demo',
      'Sep demo',
      'Oct demo',
      'Nov demo',
      'Dec demo',
    ];

    return periods[rowIndex % periods.length] ?? 'Periodo demo';
  }

  private demoLabel(column: QueryPreviewColumnDto, rowIndex: number): string {
    const text = `${column.key} ${column.label}`.toLowerCase();
    const suffix = String.fromCharCode(65 + (rowIndex % 26));

    if (text.includes('seller') || text.includes('vendedor')) {
      return `Vendedor Demo ${suffix}`;
    }

    if (text.includes('customer') || text.includes('cliente')) {
      return `Cliente Demo ${suffix}`;
    }

    if (text.includes('product') || text.includes('produto')) {
      return `Produto Demo ${suffix}`;
    }

    if (text.includes('status')) {
      return `Status Demo ${suffix}`;
    }

    return `Demo ${suffix}`;
  }

  private toColumnTypeFromDimension(
    type: QueryDefinitionDimensionType,
  ): ExecutionPreviewColumnType {
    if (type === QueryDefinitionDimensionType.Number) {
      return ExecutionPreviewColumnType.Number;
    }

    if (type === QueryDefinitionDimensionType.Boolean) {
      return ExecutionPreviewColumnType.Boolean;
    }

    if (type === QueryDefinitionDimensionType.Date) {
      return ExecutionPreviewColumnType.Date;
    }

    if (type === QueryDefinitionDimensionType.Datetime) {
      return ExecutionPreviewColumnType.Datetime;
    }

    if (type === QueryDefinitionDimensionType.Currency) {
      return ExecutionPreviewColumnType.Currency;
    }

    if (type === QueryDefinitionDimensionType.Percentage) {
      return ExecutionPreviewColumnType.Percentage;
    }

    return ExecutionPreviewColumnType.String;
  }

  private toColumnTypeFromMetric(
    metric: QueryDefinitionMetricResponseDto,
  ): ExecutionPreviewColumnType {
    const format = (metric.format ?? '').toLowerCase();

    if (format.includes('currency') || format.includes('money')) {
      return ExecutionPreviewColumnType.Currency;
    }

    if (format.includes('percentage') || format.includes('percent')) {
      return ExecutionPreviewColumnType.Percentage;
    }

    return ExecutionPreviewColumnType.Number;
  }

  private createSeed(queryDefinition: QueryDefinitionResponseDto): number {
    return this.hashText(
      [
        queryDefinition.queryKey,
        queryDefinition.type,
        queryDefinition.timeField ?? '',
        ...queryDefinition.metrics.map((metric) => metric.key),
        ...queryDefinition.dimensions.map((dimension) => dimension.key),
        ...queryDefinition.filters.map(
          (filter) => `${filter.key}:${filter.operator}:${String(filter.required)}`,
        ),
      ].join('|'),
    );
  }

  private hashText(text: string): number {
    return Array.from(text).reduce((hash, character) => {
      return (hash * 31 + character.charCodeAt(0)) % 100000;
    }, 17);
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
  }
}
