import { QueryDefinitionResponseDto } from '../../query-definitions/dto/query-definition-response.dto';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionType,
} from '../../query-definitions/schemas/query-definition.constants';
import {
  ExecutionPreviewColumnType,
  ExecutionPreviewMode,
} from '../dto/query-preview-response.dto';
import { DemoQueryPreviewGeneratorService } from '../services/demo-query-preview-generator.service';

const FIXED_DATE = new Date('2026-05-15T12:00:00.000Z');

function query(overrides: Partial<QueryDefinitionResponseDto> = {}): QueryDefinitionResponseDto {
  return {
    id: '662d4f6e7a1c2b00124f0601',
    queryKey: 'sales_overview',
    type: QueryDefinitionType.Metric,
    dimensions: [],
    metrics: [],
    filters: [],
    metadata: {},
    settings: {},
    ...overrides,
  } as unknown as QueryDefinitionResponseDto;
}

function metric(
  overrides: Record<string, unknown> = {},
): QueryDefinitionResponseDto['metrics'][number] {
  return {
    key: 'revenue',
    label: 'Receita',
    aggregation: QueryDefinitionAggregation.Sum,
    ...overrides,
  } as unknown as QueryDefinitionResponseDto['metrics'][number];
}

function dimension(
  overrides: Record<string, unknown> = {},
): QueryDefinitionResponseDto['dimensions'][number] {
  return {
    key: 'seller',
    label: 'Vendedor',
    type: QueryDefinitionDimensionType.String,
    ...overrides,
  } as unknown as QueryDefinitionResponseDto['dimensions'][number];
}

describe('DemoQueryPreviewGeneratorService', () => {
  let generator: DemoQueryPreviewGeneratorService;

  beforeEach(() => {
    generator = new DemoQueryPreviewGeneratorService();
  });

  it('produces a deterministic preview for the same query definition', () => {
    const definition = query({
      type: QueryDefinitionType.Timeseries,
      metrics: [metric()],
    });

    const first = generator.generate(definition, { generatedAt: FIXED_DATE, rowLimit: 5 });
    const second = generator.generate(definition, { generatedAt: FIXED_DATE, rowLimit: 5 });

    expect(first).toEqual(second);
  });

  it('returns a single row for a metric query without dimensions', () => {
    const result = generator.generate(
      query({ type: QueryDefinitionType.Metric, metrics: [metric()] }),
    );

    expect(result.rows).toHaveLength(1);
    expect(result.meta.rowCount).toBe(1);
  });

  it('clamps the requested row limit for a timeseries query between 1 and 12', () => {
    const definition = query({ type: QueryDefinitionType.Timeseries, metrics: [metric()] });

    expect(generator.generate(definition, { rowLimit: 4 }).rows).toHaveLength(4);
    expect(generator.generate(definition, { rowLimit: 999 }).rows).toHaveLength(12);
    expect(generator.generate(definition, { rowLimit: 0 }).rows).toHaveLength(1);
  });

  it('caps table-type previews at six rows even when a larger limit is requested', () => {
    const result = generator.generate(query({ type: QueryDefinitionType.Table }), { rowLimit: 12 });

    expect(result.rows).toHaveLength(6);
  });

  it('infers columns from explicit dimensions and metrics with their declared types', () => {
    const result = generator.generate(
      query({
        type: QueryDefinitionType.Table,
        dimensions: [
          dimension({ key: 'active', label: 'Ativo', type: QueryDefinitionDimensionType.Boolean }),
        ],
        metrics: [metric({ key: 'amount', label: 'Valor', format: 'currency' })],
      }),
    );

    expect(result.columns.map((column) => column.key)).toEqual(['active', 'amount']);
    expect(result.columns[0]?.type).toBe(ExecutionPreviewColumnType.Boolean);
    expect(result.columns[1]?.type).toBe(ExecutionPreviewColumnType.Currency);
  });

  it('falls back to demo columns when no dimensions or metrics are declared', () => {
    const result = generator.generate(query({ type: QueryDefinitionType.Table }));

    expect(result.columns.map((column) => column.key)).toEqual(['demo_item', 'demo_value']);
    expect(result.columns[1]?.type).toBe(ExecutionPreviewColumnType.Number);
  });

  it('generates currency metric values as numbers in a plausible demo range', () => {
    const result = generator.generate(
      query({
        type: QueryDefinitionType.Table,
        metrics: [metric({ key: 'amount', label: 'Valor', format: 'currency' })],
      }),
    );

    for (const row of result.rows) {
      expect(typeof row.amount).toBe('number');
      expect(row.amount as number).toBeGreaterThanOrEqual(50000);
    }
  });

  it('generates percentage metric values as fractions below one', () => {
    const result = generator.generate(
      query({
        type: QueryDefinitionType.Table,
        metrics: [metric({ key: 'rate', label: 'Taxa', format: 'percentage' })],
      }),
    );

    for (const row of result.rows) {
      expect(row.rate as number).toBeLessThan(1);
    }
  });

  it('renders a demo period column for timeseries queries without dimensions', () => {
    const result = generator.generate(
      query({ type: QueryDefinitionType.Timeseries, metrics: [metric()] }),
      { rowLimit: 3 },
    );

    expect(result.columns[0]?.key).toBe('period');
    expect(String(result.rows[0]?.period)).toContain('demo');
  });

  it('never leaks query metadata, settings or filter values into the preview', () => {
    const result = generator.generate(
      query({
        type: QueryDefinitionType.Table,
        metrics: [metric()],
        metadata: { apiKey: 'must-not-leak-secret' },
        settings: { token: 'must-not-leak-secret' },
        filters: [
          {
            key: 'region',
            operator: 'equals',
            required: true,
            defaultValue: 'must-not-leak-secret',
          },
        ] as unknown as QueryDefinitionResponseDto['filters'],
      }),
    );

    expect(JSON.stringify(result)).not.toContain('must-not-leak-secret');
  });

  it('marks the result as a demo preview with consistent metadata', () => {
    const result = generator.generate(
      query({ type: QueryDefinitionType.Table, metrics: [metric()] }),
      { generatedAt: FIXED_DATE },
    );

    expect(result.mode).toBe(ExecutionPreviewMode.Demo);
    expect(result.generatedAt).toBe(FIXED_DATE.toISOString());
    expect(result.meta).toEqual({
      rowCount: result.rows.length,
      isPreview: true,
      source: 'demo-generator',
    });
  });
});
