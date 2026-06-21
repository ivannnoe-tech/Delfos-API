import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../schemas/dashboard-definition.schema';
import { DashboardDefinitionFilterDto } from './dashboard-definition-filter.dto';
import { DashboardDefinitionLayoutDto } from './dashboard-definition-layout.dto';
import { DashboardDefinitionSectionDto } from './dashboard-definition-section.dto';
import { DashboardDefinitionWidgetDto } from './dashboard-definition-widget.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class CreateDashboardDefinitionDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ example: 'sales_dashboard' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  dashboardKey!: string;

  @ApiProperty({ example: 'Dashboard de vendas' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Painel logico para acompanhamento comercial' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: DashboardDefinitionStatus,
    default: DashboardDefinitionStatus.Draft,
  })
  @IsOptional()
  @IsEnum(DashboardDefinitionStatus)
  status?: DashboardDefinitionStatus;

  @ApiPropertyOptional({
    enum: DashboardDefinitionVisibility,
    default: DashboardDefinitionVisibility.Tenant,
  })
  @IsOptional()
  @IsEnum(DashboardDefinitionVisibility)
  visibility?: DashboardDefinitionVisibility;

  @ApiPropertyOptional({ type: DashboardDefinitionLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardDefinitionLayoutDto)
  layout?: DashboardDefinitionLayoutDto;

  @ApiPropertyOptional({ type: [DashboardDefinitionSectionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DashboardDefinitionSectionDto)
  sections?: DashboardDefinitionSectionDto[];

  @ApiPropertyOptional({ type: [DashboardDefinitionWidgetDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DashboardDefinitionWidgetDto)
  widgets?: DashboardDefinitionWidgetDto[];

  @ApiPropertyOptional({ type: [DashboardDefinitionFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DashboardDefinitionFilterDto)
  filters?: DashboardDefinitionFilterDto[];

  @ApiPropertyOptional({ example: ['sales', 'overview'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(stableKeyPattern, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { visibleInBuilder: true } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
