import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import {
  DashboardDefinitionLayoutDensity,
  DashboardDefinitionLayoutGap,
  DashboardDefinitionLayoutType,
} from '../schemas/dashboard-definition.constants';

export class DashboardDefinitionLayoutDto {
  @ApiPropertyOptional({
    enum: DashboardDefinitionLayoutType,
    default: DashboardDefinitionLayoutType.Grid,
  })
  @IsOptional()
  @IsEnum(DashboardDefinitionLayoutType)
  type?: DashboardDefinitionLayoutType;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  columns?: number;

  @ApiPropertyOptional({ enum: DashboardDefinitionLayoutGap })
  @IsOptional()
  @IsEnum(DashboardDefinitionLayoutGap)
  gap?: DashboardDefinitionLayoutGap;

  @ApiPropertyOptional({ enum: DashboardDefinitionLayoutDensity })
  @IsOptional()
  @IsEnum(DashboardDefinitionLayoutDensity)
  density?: DashboardDefinitionLayoutDensity;
}
