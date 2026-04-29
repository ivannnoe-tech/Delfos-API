import { ApiProperty } from '@nestjs/swagger';

export enum ExecutionPreviewMode {
  Demo = 'demo',
}

export enum ExecutionPreviewColumnType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  Datetime = 'datetime',
  Currency = 'currency',
  Percentage = 'percentage',
}

export type QueryPreviewCellValue = string | number | boolean | null;
export type QueryPreviewRow = Record<string, QueryPreviewCellValue>;

export class QueryPreviewColumnDto {
  @ApiProperty({ example: 'period' })
  key!: string;

  @ApiProperty({ example: 'Periodo' })
  label!: string;

  @ApiProperty({ enum: ExecutionPreviewColumnType })
  type!: ExecutionPreviewColumnType;
}

export class QueryPreviewMetaDto {
  @ApiProperty({ example: 1 })
  rowCount!: number;

  @ApiProperty({ example: true })
  isPreview!: boolean;

  @ApiProperty({ example: 'demo-generator' })
  source!: string;
}

export class QueryPreviewResultDto {
  @ApiProperty({ enum: ExecutionPreviewMode, example: ExecutionPreviewMode.Demo })
  mode!: ExecutionPreviewMode;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId!: string;

  @ApiProperty({ example: 'sales_overview_demo' })
  queryKey!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  generatedAt!: string;

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

  @ApiProperty({ type: QueryPreviewMetaDto })
  meta!: QueryPreviewMetaDto;
}
