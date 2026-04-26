import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
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

import {
  DashboardDefinitionChartType,
  DashboardDefinitionWidgetType,
} from '../schemas/dashboard-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class DashboardDefinitionWidgetSizeDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  cols!: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  rows!: number;
}

export class DashboardDefinitionWidgetPositionDto {
  @ApiProperty({ example: 0, minimum: 0, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  x!: number;

  @ApiProperty({ example: 0, minimum: 0, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  y!: number;
}

export class DashboardDefinitionVisualizationDto {
  @ApiPropertyOptional({ enum: DashboardDefinitionChartType })
  @IsOptional()
  @IsEnum(DashboardDefinitionChartType)
  chartType?: DashboardDefinitionChartType;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  xField?: string;

  @ApiPropertyOptional({ example: ['total_amount'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  yFields?: string[];

  @ApiPropertyOptional({ example: 'seller_name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  groupBy?: string;

  @ApiPropertyOptional({ example: 'currency' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  format?: string;
}

export class DashboardDefinitionWidgetDto {
  @ApiProperty({ example: 'total_sales' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Vendas totais' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Soma das vendas do periodo' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ enum: DashboardDefinitionWidgetType })
  @IsEnum(DashboardDefinitionWidgetType)
  type!: DashboardDefinitionWidgetType;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  @IsOptional()
  @IsMongoId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: 'overview' })
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

  @ApiPropertyOptional({ type: DashboardDefinitionWidgetSizeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardDefinitionWidgetSizeDto)
  size?: DashboardDefinitionWidgetSizeDto;

  @ApiPropertyOptional({ type: DashboardDefinitionWidgetPositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardDefinitionWidgetPositionDto)
  position?: DashboardDefinitionWidgetPositionDto;

  @ApiPropertyOptional({ type: DashboardDefinitionVisualizationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardDefinitionVisualizationDto)
  visualization?: DashboardDefinitionVisualizationDto;

  @ApiPropertyOptional({ example: { showTrend: true } })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
