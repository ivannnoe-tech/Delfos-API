import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.schema';
import { QueryDefinitionDimensionDto } from './query-definition-dimension.dto';
import { QueryDefinitionFilterDto } from './query-definition-filter.dto';
import { QueryDefinitionMetricDto } from './query-definition-metric.dto';
import { QueryDefinitionSortDto } from './query-definition-sort.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class CreateQueryDefinitionDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0501' })
  @IsEntityId()
  datasetId!: string;

  @ApiProperty({ example: 'sales_overview' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  queryKey!: string;

  @ApiProperty({ example: 'Visao geral de vendas' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Definicao logica para indicadores de vendas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: QueryDefinitionStatus, default: QueryDefinitionStatus.Draft })
  @IsOptional()
  @IsEnum(QueryDefinitionStatus)
  status?: QueryDefinitionStatus;

  @ApiPropertyOptional({ enum: QueryDefinitionType, default: QueryDefinitionType.Table })
  @IsOptional()
  @IsEnum(QueryDefinitionType)
  type?: QueryDefinitionType;

  @ApiPropertyOptional({ type: [QueryDefinitionMetricDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QueryDefinitionMetricDto)
  metrics?: QueryDefinitionMetricDto[];

  @ApiPropertyOptional({ type: [QueryDefinitionDimensionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QueryDefinitionDimensionDto)
  dimensions?: QueryDefinitionDimensionDto[];

  @ApiPropertyOptional({ type: [QueryDefinitionFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QueryDefinitionFilterDto)
  filters?: QueryDefinitionFilterDto[];

  @ApiPropertyOptional({ type: [QueryDefinitionSortDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => QueryDefinitionSortDto)
  sorts?: QueryDefinitionSortDto[];

  @ApiPropertyOptional({ example: 100, minimum: 1, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  defaultLimit?: number;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  timeField?: string;

  @ApiPropertyOptional({ enum: QueryDefinitionTimeGranularity, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(QueryDefinitionTimeGranularity, { each: true })
  allowedGranularities?: QueryDefinitionTimeGranularity[];

  @ApiPropertyOptional({ example: ['sales', 'overview'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { visibleInBuilder: true } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
