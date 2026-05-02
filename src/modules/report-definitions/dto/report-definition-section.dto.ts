import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ReportDefinitionLayoutDto,
  ReportDefinitionLayoutResponseDto,
} from './report-definition-layout.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ReportDefinitionSectionDto {
  @ApiProperty({ example: 'summary' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Resumo executivo' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Secao declarativa com indicadores principais' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 1, minimum: 0, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  order!: number;

  @ApiPropertyOptional({ type: ReportDefinitionLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportDefinitionLayoutDto)
  layout?: ReportDefinitionLayoutDto;
}

export class ReportDefinitionSectionResponseDto {
  @ApiProperty({ example: 'summary' })
  key!: string;

  @ApiProperty({ example: 'Resumo executivo' })
  title!: string;

  @ApiPropertyOptional({ example: 'Secao declarativa com indicadores principais' })
  description?: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ type: ReportDefinitionLayoutResponseDto })
  layout?: ReportDefinitionLayoutResponseDto;
}
