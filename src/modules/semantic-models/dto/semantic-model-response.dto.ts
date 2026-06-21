import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  SemanticCardinalityHint,
  SemanticDimensionDomain,
  SemanticMeasureAggregation,
  SemanticModelStatus,
  SemanticQualityLevel,
  SemanticType,
} from '../schemas/semantic-model.constants';

export class SemanticModelQualityResponseDto {
  @ApiPropertyOptional({ example: 72 })
  score?: number;

  @ApiPropertyOptional({ enum: SemanticQualityLevel })
  level?: SemanticQualityLevel;

  @ApiProperty({ example: ['Modelo sem steward definido.'] })
  warnings!: string[];
}

export class SemanticMeasureResponseDto {
  @ApiProperty({ example: 'faturamento' })
  key!: string;

  @ApiProperty({ example: 'Faturamento' })
  name!: string;

  @ApiPropertyOptional({ example: 'Soma declarativa do valor faturado.' })
  description?: string;

  @ApiProperty({ enum: SemanticMeasureAggregation })
  aggregation!: SemanticMeasureAggregation;

  @ApiPropertyOptional({ enum: SemanticType })
  semanticType?: SemanticType;

  @ApiPropertyOptional({ example: 'sales_orders_demo' })
  datasetKey?: string;

  @ApiPropertyOptional({ example: 'total_amount' })
  fieldKey?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  unit?: string;

  @ApiPropertyOptional({ example: 'currency' })
  formatHint?: string;

  @ApiProperty({ enum: SemanticModelStatus })
  status!: SemanticModelStatus;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  owner?: string;

  @ApiProperty({ example: ['comercial'] })
  tags!: string[];

  @ApiProperty({ example: false })
  isReusable!: boolean;

  @ApiProperty({ example: [] })
  warnings!: string[];

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;
}

export class SemanticDimensionResponseDto {
  @ApiProperty({ example: 'cidade' })
  key!: string;

  @ApiProperty({ example: 'Cidade' })
  name!: string;

  @ApiPropertyOptional({ example: 'Recorte declarativo por cidade.' })
  description?: string;

  @ApiPropertyOptional({ enum: SemanticType })
  semanticType?: SemanticType;

  @ApiProperty({ enum: SemanticDimensionDomain })
  domain!: SemanticDimensionDomain;

  @ApiPropertyOptional({ example: 'customers_demo' })
  datasetKey?: string;

  @ApiPropertyOptional({ example: 'city_name' })
  fieldKey?: string;

  @ApiPropertyOptional({ enum: SemanticCardinalityHint })
  cardinalityHint?: SemanticCardinalityHint;

  @ApiProperty({ enum: SemanticModelStatus })
  status!: SemanticModelStatus;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  owner?: string;

  @ApiProperty({ example: ['geografia'] })
  tags!: string[];

  @ApiProperty({ example: [] })
  warnings!: string[];

  @ApiProperty({ example: { domain: 'geography' } })
  metadata!: SanitizedMetadata;
}

export class SemanticGlossaryTermResponseDto {
  @ApiProperty({ example: 'cliente_ativo' })
  key!: string;

  @ApiProperty({ example: 'Cliente ativo' })
  name!: string;

  @ApiPropertyOptional({ example: 'Termo de negocio declarativo.' })
  description?: string;

  @ApiProperty({ example: ['conta ativa'] })
  aliases!: string[];

  @ApiPropertyOptional({ enum: SemanticDimensionDomain })
  domain?: SemanticDimensionDomain;

  @ApiProperty({ example: ['clientes_ativos'] })
  relatedMeasureKeys!: string[];

  @ApiProperty({ example: ['cliente'] })
  relatedDimensionKeys!: string[];

  @ApiProperty({ enum: SemanticModelStatus })
  status!: SemanticModelStatus;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  owner?: string;

  @ApiProperty({ example: ['glossario'] })
  tags!: string[];

  @ApiProperty({ example: { domain: 'customer' } })
  metadata!: SanitizedMetadata;
}

export class SemanticModelResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0901' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: 'comercial_semantico' })
  modelKey!: string;

  @ApiProperty({ example: 'Modelo semantico comercial' })
  name!: string;

  @ApiPropertyOptional({ example: 'Agrupamento semantico declarativo.' })
  description?: string;

  @ApiProperty({ enum: SemanticModelStatus })
  status!: SemanticModelStatus;

  @ApiProperty({ example: ['sales_orders_demo', 'customers_demo'] })
  datasetKeys!: string[];

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  owner?: string;

  @ApiPropertyOptional({ example: 'dev-actor-002' })
  steward?: string;

  @ApiPropertyOptional({ example: 'dev-actor-003' })
  certificationOwner?: string;

  @ApiProperty({ example: ['comercial', 'foundation'] })
  tags!: string[];

  @ApiProperty({ type: SemanticModelQualityResponseDto })
  quality!: SemanticModelQualityResponseDto;

  @ApiProperty({ type: [SemanticMeasureResponseDto] })
  measures!: SemanticMeasureResponseDto[];

  @ApiProperty({ type: [SemanticDimensionResponseDto] })
  dimensions!: SemanticDimensionResponseDto[];

  @ApiProperty({ type: [SemanticGlossaryTermResponseDto] })
  glossaryTerms!: SemanticGlossaryTermResponseDto[];

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: { visibleInBuilder: true } })
  settings!: SanitizedMetadata;

  @ApiProperty({ example: '2026-05-17T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-17T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  updatedBy?: string;
}

export class SemanticModelListResponseDto {
  @ApiProperty({ type: [SemanticModelResponseDto] })
  items!: SemanticModelResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
