import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata, SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionFilterOperator,
  QueryDefinitionSortDirection,
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.schema';

export class QueryDefinitionMetricResponseDto {
  @ApiProperty({ example: 'total_sales' })
  key!: string;

  @ApiProperty({ example: 'Vendas totais' })
  label!: string;

  @ApiProperty({ example: 'total_amount' })
  field!: string;

  @ApiProperty({ enum: QueryDefinitionAggregation })
  aggregation!: QueryDefinitionAggregation;

  @ApiPropertyOptional({ example: 'currency' })
  format?: string;

  @ApiPropertyOptional({ example: 'Soma do valor total de vendas' })
  description?: string;
}

export class QueryDefinitionDimensionResponseDto {
  @ApiProperty({ example: 'seller' })
  key!: string;

  @ApiProperty({ example: 'Vendedor' })
  label!: string;

  @ApiProperty({ example: 'seller_name' })
  field!: string;

  @ApiProperty({ enum: QueryDefinitionDimensionType })
  type!: QueryDefinitionDimensionType;

  @ApiPropertyOptional({ example: 'Nome do vendedor' })
  description?: string;
}

export class QueryDefinitionFilterResponseDto {
  @ApiProperty({ example: 'period' })
  key!: string;

  @ApiProperty({ example: 'Periodo' })
  label!: string;

  @ApiProperty({ example: 'created_at' })
  field!: string;

  @ApiProperty({ enum: QueryDefinitionFilterOperator })
  operator!: QueryDefinitionFilterOperator;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  defaultValue?: SanitizedMetadataValue;

  @ApiProperty({ example: ['open', 'closed'] })
  allowedValues!: SanitizedMetadataValue[];
}

export class QueryDefinitionSortResponseDto {
  @ApiProperty({ example: 'total_amount' })
  field!: string;

  @ApiProperty({ enum: QueryDefinitionSortDirection })
  direction!: QueryDefinitionSortDirection;
}

export class QueryDefinitionResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0601' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0501' })
  datasetId!: string;

  @ApiProperty({ example: 'sales_overview' })
  queryKey!: string;

  @ApiProperty({ example: 'Visao geral de vendas' })
  name!: string;

  @ApiPropertyOptional({ example: 'Definicao logica para indicadores de vendas' })
  description?: string;

  @ApiProperty({ enum: QueryDefinitionStatus })
  status!: QueryDefinitionStatus;

  @ApiProperty({ enum: QueryDefinitionType })
  type!: QueryDefinitionType;

  @ApiProperty({ type: [QueryDefinitionMetricResponseDto] })
  metrics!: QueryDefinitionMetricResponseDto[];

  @ApiProperty({ type: [QueryDefinitionDimensionResponseDto] })
  dimensions!: QueryDefinitionDimensionResponseDto[];

  @ApiProperty({ type: [QueryDefinitionFilterResponseDto] })
  filters!: QueryDefinitionFilterResponseDto[];

  @ApiProperty({ type: [QueryDefinitionSortResponseDto] })
  sorts!: QueryDefinitionSortResponseDto[];

  @ApiPropertyOptional({ example: 100 })
  defaultLimit?: number;

  @ApiPropertyOptional({ example: 'created_at' })
  timeField?: string;

  @ApiProperty({ enum: QueryDefinitionTimeGranularity, isArray: true })
  allowedGranularities!: QueryDefinitionTimeGranularity[];

  @ApiProperty({ example: ['sales', 'overview'] })
  tags!: string[];

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: { visibleInBuilder: true } })
  settings!: SanitizedMetadata;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  updatedBy?: string;
}

export class QueryDefinitionListResponseDto {
  @ApiProperty({ type: [QueryDefinitionResponseDto] })
  items!: QueryDefinitionResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
