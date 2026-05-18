import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SemanticModelStatus } from '../schemas/semantic-model.schema';
import { SemanticDimensionDto } from './semantic-dimension.dto';
import { SemanticGlossaryTermDto } from './semantic-glossary-term.dto';
import { SemanticMeasureDto } from './semantic-measure.dto';
import { SemanticModelQualityDto } from './semantic-model-quality.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class CreateSemanticModelDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiProperty({ example: 'comercial_semantico' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  modelKey!: string;

  @ApiProperty({ example: 'Modelo semantico comercial' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Agrupamento semantico declarativo. Nenhuma query e executada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: SemanticModelStatus,
    default: SemanticModelStatus.Draft,
  })
  @IsOptional()
  @IsEnum(SemanticModelStatus)
  status?: SemanticModelStatus;

  @ApiPropertyOptional({ example: ['sales_orders_demo', 'customers_demo'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @Matches(stableKeyPattern, { each: true })
  datasetKeys?: string[];

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  owner?: string;

  @ApiPropertyOptional({ example: 'dev-actor-002' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  steward?: string;

  @ApiPropertyOptional({ example: 'dev-actor-003' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  certificationOwner?: string;

  @ApiPropertyOptional({ example: ['comercial', 'foundation'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: SemanticModelQualityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SemanticModelQualityDto)
  quality?: SemanticModelQualityDto;

  @ApiPropertyOptional({ type: [SemanticMeasureDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SemanticMeasureDto)
  measures?: SemanticMeasureDto[];

  @ApiPropertyOptional({ type: [SemanticDimensionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SemanticDimensionDto)
  dimensions?: SemanticDimensionDto[];

  @ApiPropertyOptional({ type: [SemanticGlossaryTermDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SemanticGlossaryTermDto)
  glossaryTerms?: SemanticGlossaryTermDto[];

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { visibleInBuilder: true } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
