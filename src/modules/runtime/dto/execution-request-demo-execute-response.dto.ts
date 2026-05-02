import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export type ExecutionRequestDemoScalar = string | number | boolean | null;
export type ExecutionRequestDemoRow = Record<string, ExecutionRequestDemoScalar>;

export class ExecutionRequestDemoMetricDto {
  @ApiProperty({ example: 'demo_total_revenue' })
  key!: string;

  @ApiProperty({ example: 'Demo total revenue' })
  label!: string;

  @ApiProperty({ example: 125000 })
  value!: number;

  @ApiPropertyOptional({ example: 'BRL' })
  unit?: string;
}

export class ExecutionRequestDemoQueryResultDto {
  @ApiProperty({
    example: [
      { period: 'Jan demo', total_demo_value: 125000, records_demo_count: 42 },
      { period: 'Feb demo', total_demo_value: 132500, records_demo_count: 47 },
    ],
  })
  sampleRows!: ExecutionRequestDemoRow[];

  @ApiProperty({ type: [ExecutionRequestDemoMetricDto] })
  sampleMetrics!: ExecutionRequestDemoMetricDto[];
}

export class ExecutionRequestDemoWidgetDto {
  @ApiProperty({ example: 'demo_total_value' })
  widgetKey!: string;

  @ApiProperty({ example: 'Demo total value' })
  title!: string;

  @ApiProperty({ example: 'metric_card' })
  type!: string;

  @ApiProperty({ example: 'ready' })
  status!: string;

  @ApiProperty({ type: [ExecutionRequestDemoMetricDto] })
  sampleMetrics!: ExecutionRequestDemoMetricDto[];
}

export class ExecutionRequestDemoDashboardResultDto {
  @ApiProperty({ type: [ExecutionRequestDemoWidgetDto] })
  sampleWidgets!: ExecutionRequestDemoWidgetDto[];
}

export class ExecutionRequestDemoReportBlockDto {
  @ApiProperty({ example: 'demo_summary' })
  blockKey!: string;

  @ApiProperty({ example: 'Demo summary' })
  title!: string;

  @ApiProperty({ example: 'summary' })
  type!: string;

  @ApiProperty({ example: 'ready' })
  status!: string;
}

export class ExecutionRequestDemoReportResultDto {
  @ApiProperty({ type: [ExecutionRequestDemoReportBlockDto] })
  sampleReportBlocks!: ExecutionRequestDemoReportBlockDto[];

  @ApiProperty({
    example: 'Export preview only. No PDF, Excel or CSV file was generated.',
  })
  exportPreview!: string;
}

export class ExecutionRequestDemoResultDto {
  @ApiPropertyOptional({ type: ExecutionRequestDemoQueryResultDto })
  query?: ExecutionRequestDemoQueryResultDto;

  @ApiPropertyOptional({ type: ExecutionRequestDemoDashboardResultDto })
  dashboard?: ExecutionRequestDemoDashboardResultDto;

  @ApiPropertyOptional({ type: ExecutionRequestDemoReportResultDto })
  report?: ExecutionRequestDemoReportResultDto;
}

export class ExecutionRequestDemoExecuteResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0901' })
  executionRequestId!: string;

  @ApiProperty({ example: 'exec_req_662d4f6e7a1c2b00124f0901' })
  requestKey!: string;

  @ApiProperty({ enum: ExecutionRequestKind })
  kind!: ExecutionRequestKind;

  @ApiProperty({
    enum: [ExecutionRequestStatus.CompletedDemo, ExecutionRequestStatus.Blocked],
    example: ExecutionRequestStatus.CompletedDemo,
  })
  status!: ExecutionRequestStatus.CompletedDemo | ExecutionRequestStatus.Blocked;

  @ApiProperty({ enum: [ExecutionRequestMode.Demo], example: ExecutionRequestMode.Demo })
  mode!: ExecutionRequestMode.Demo;

  @ApiProperty({ example: '2026-05-02T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  ready!: boolean;

  @ApiProperty({
    example:
      'Demo execution completed with fictitious data only. No connector, query, export, worker, queue, cache or scheduler was used.',
  })
  summary!: string;

  @ApiProperty({ example: 6 })
  checksCount!: number;

  @ApiProperty({ example: 0 })
  warningsCount!: number;

  @ApiProperty({ example: 0 })
  blockersCount!: number;

  @ApiPropertyOptional({ type: ExecutionRequestDemoResultDto })
  demoResult?: ExecutionRequestDemoResultDto;

  @ApiProperty({
    example:
      'Demo runtime executor foundation generated a safe demo result. No real runtime execution was started.',
  })
  message!: string;

  @ApiProperty({ example: 'demo_runtime_executor_foundation' })
  reason!: string;
}
