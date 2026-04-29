import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DashboardDefinitionChartType } from '../../dashboard-definitions/schemas/dashboard-definition.schema';
import {
  ExecutionPreviewMode,
  QueryPreviewColumnDto,
  QueryPreviewRow,
} from './query-preview-response.dto';

export enum DashboardPreviewWidgetStatus {
  Ready = 'ready',
  Degraded = 'degraded',
}

export enum DashboardPreviewWidgetStatusReason {
  MissingQueryDefinition = 'missing_query_definition',
  QueryDefinitionNotFound = 'query_definition_not_found',
}

export class DashboardPreviewVisualizationDto {
  @ApiPropertyOptional({ enum: DashboardDefinitionChartType })
  chartType?: DashboardDefinitionChartType;

  @ApiPropertyOptional({ example: 'period' })
  xField?: string;

  @ApiProperty({ example: ['total_sales'] })
  yFields!: string[];

  @ApiPropertyOptional({ example: 'seller' })
  groupBy?: string;

  @ApiPropertyOptional({ example: 'currency' })
  format?: string;
}

export class DashboardPreviewWidgetDataDto {
  @ApiProperty({ type: [QueryPreviewColumnDto] })
  columns!: QueryPreviewColumnDto[];

  @ApiProperty({
    example: [{ period: 'Jan demo', total_sales: 125000 }],
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: {
        oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
      },
    },
  })
  rows!: QueryPreviewRow[];
}

export class DashboardPreviewWidgetDto {
  @ApiProperty({ example: 'total_sales' })
  widgetKey!: string;

  @ApiProperty({ example: 'Vendas totais' })
  title!: string;

  @ApiProperty({ example: 'metric_card' })
  type!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId?: string;

  @ApiProperty({ enum: DashboardPreviewWidgetStatus })
  status!: DashboardPreviewWidgetStatus;

  @ApiPropertyOptional({ enum: DashboardPreviewWidgetStatusReason })
  reason?: DashboardPreviewWidgetStatusReason;

  @ApiProperty({ type: DashboardPreviewVisualizationDto })
  visualization!: DashboardPreviewVisualizationDto;

  @ApiProperty({ type: DashboardPreviewWidgetDataDto })
  data!: DashboardPreviewWidgetDataDto;
}

export class DashboardPreviewMetaDto {
  @ApiProperty({ example: true })
  isPreview!: boolean;

  @ApiProperty({ example: 'demo-generator' })
  source!: string;

  @ApiProperty({ example: 1 })
  widgetsCount!: number;

  @ApiProperty({ example: 1 })
  readyWidgetsCount!: number;
}

export class DashboardPreviewResultDto {
  @ApiProperty({ enum: ExecutionPreviewMode, example: ExecutionPreviewMode.Demo })
  mode!: ExecutionPreviewMode;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0701' })
  dashboardDefinitionId!: string;

  @ApiProperty({ example: 'commercial_dashboard_demo' })
  dashboardKey!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ type: [DashboardPreviewWidgetDto] })
  widgets!: DashboardPreviewWidgetDto[];

  @ApiProperty({ type: DashboardPreviewMetaDto })
  meta!: DashboardPreviewMetaDto;
}
