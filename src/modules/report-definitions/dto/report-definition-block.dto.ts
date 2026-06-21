import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { ReportDefinitionBlockType } from '../schemas/report-definition.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ReportDefinitionBlockDto {
  @ApiProperty({ example: 'sales_table' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Tabela de vendas' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Bloco declarativo sem execucao de consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ enum: ReportDefinitionBlockType })
  @IsEnum(ReportDefinitionBlockType)
  type!: ReportDefinitionBlockType;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  @IsOptional()
  @IsEntityId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  @IsOptional()
  @IsEntityId()
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ example: 'summary' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  sectionKey?: string;

  @ApiProperty({ example: 1, minimum: 0, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  order!: number;

  @ApiPropertyOptional({ example: { showTotals: true } })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

export class ReportDefinitionBlockResponseDto {
  @ApiProperty({ example: 'sales_table' })
  key!: string;

  @ApiProperty({ example: 'Tabela de vendas' })
  title!: string;

  @ApiPropertyOptional({ example: 'Bloco declarativo sem execucao de consulta' })
  description?: string;

  @ApiProperty({ enum: ReportDefinitionBlockType })
  type!: ReportDefinitionBlockType;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ example: 'summary' })
  sectionKey?: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: { showTotals: true } })
  options!: SanitizedMetadata;
}
