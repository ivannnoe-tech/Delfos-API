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

import { DashboardDefinitionLayoutDto } from './dashboard-definition-layout.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class DashboardDefinitionSectionDto {
  @ApiProperty({ example: 'overview' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Visao geral' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Indicadores principais' })
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

  @ApiPropertyOptional({ type: DashboardDefinitionLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardDefinitionLayoutDto)
  layout?: DashboardDefinitionLayoutDto;
}
