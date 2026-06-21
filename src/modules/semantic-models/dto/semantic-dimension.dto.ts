import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  SemanticCardinalityHint,
  SemanticDimensionDomain,
  SemanticModelStatus,
  SemanticType,
} from '../schemas/semantic-model.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class SemanticDimensionDto {
  @ApiProperty({ example: 'cidade' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Cidade' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Recorte declarativo por cidade.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ enum: SemanticType })
  @IsOptional()
  @IsEnum(SemanticType)
  semanticType?: SemanticType;

  @ApiProperty({ enum: SemanticDimensionDomain })
  @IsEnum(SemanticDimensionDomain)
  domain!: SemanticDimensionDomain;

  @ApiPropertyOptional({ example: 'customers_demo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  datasetKey?: string;

  @ApiPropertyOptional({ example: 'city_name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fieldKey?: string;

  @ApiPropertyOptional({ enum: SemanticCardinalityHint })
  @IsOptional()
  @IsEnum(SemanticCardinalityHint)
  cardinalityHint?: SemanticCardinalityHint;

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

  @ApiPropertyOptional({ example: ['geografia'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['Sem cardinalidade declarada.'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  warnings?: string[];

  @ApiPropertyOptional({ example: { domain: 'geography' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
