import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ReportDefinitionLayoutDensity,
  ReportDefinitionLayoutType,
} from '../schemas/report-definition.schema';

export class ReportDefinitionLayoutDto {
  @ApiPropertyOptional({
    enum: ReportDefinitionLayoutType,
    default: ReportDefinitionLayoutType.Paged,
  })
  @IsOptional()
  @IsEnum(ReportDefinitionLayoutType)
  type?: ReportDefinitionLayoutType;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  columns?: number;

  @ApiPropertyOptional({ enum: ReportDefinitionLayoutDensity })
  @IsOptional()
  @IsEnum(ReportDefinitionLayoutDensity)
  density?: ReportDefinitionLayoutDensity;
}

export class ReportDefinitionLayoutResponseDto {
  @ApiProperty({ enum: ReportDefinitionLayoutType })
  type!: ReportDefinitionLayoutType;

  @ApiPropertyOptional({ example: 12 })
  columns?: number;

  @ApiPropertyOptional({ enum: ReportDefinitionLayoutDensity })
  density?: ReportDefinitionLayoutDensity;
}
