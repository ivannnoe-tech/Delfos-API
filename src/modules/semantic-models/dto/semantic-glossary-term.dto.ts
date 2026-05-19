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

import { SemanticDimensionDomain, SemanticModelStatus } from '../schemas/semantic-model.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class SemanticGlossaryTermDto {
  @ApiProperty({ example: 'cliente_ativo' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Cliente ativo' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Termo de negocio declarativo. Sem regra executavel.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: ['conta ativa'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  aliases?: string[];

  @ApiPropertyOptional({ enum: SemanticDimensionDomain })
  @IsOptional()
  @IsEnum(SemanticDimensionDomain)
  domain?: SemanticDimensionDomain;

  @ApiPropertyOptional({ example: ['clientes_ativos'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @Matches(stableKeyPattern, { each: true })
  relatedMeasureKeys?: string[];

  @ApiPropertyOptional({ example: ['cliente'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @Matches(stableKeyPattern, { each: true })
  relatedDimensionKeys?: string[];

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

  @ApiPropertyOptional({ example: ['glossario'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { domain: 'customer' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
