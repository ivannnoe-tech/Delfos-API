import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  SemanticMeasureAggregation,
  SemanticModelStatus,
  SemanticType,
} from '../schemas/semantic-model.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class SemanticMeasureDto {
  @ApiProperty({ example: 'faturamento' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Faturamento' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Soma declarativa do valor faturado.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ enum: SemanticMeasureAggregation })
  @IsEnum(SemanticMeasureAggregation)
  aggregation!: SemanticMeasureAggregation;

  @ApiPropertyOptional({ enum: SemanticType })
  @IsOptional()
  @IsEnum(SemanticType)
  semanticType?: SemanticType;

  @ApiPropertyOptional({ example: 'sales_orders_demo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  datasetKey?: string;

  @ApiPropertyOptional({ example: 'total_amount' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fieldKey?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @ApiPropertyOptional({ example: 'currency' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  formatHint?: string;

  @ApiPropertyOptional({
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  @IsOptional()
  @IsEnum(SemanticModelStatus)
  status?: SemanticModelStatus;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  owner?: string;

  @ApiPropertyOptional({ example: ['comercial'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isReusable?: boolean;

  @ApiPropertyOptional({ example: ['Sem owner definido.'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  warnings?: string[];

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
