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
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.constants';
import { ReportDefinitionBlockDto } from './report-definition-block.dto';
import { ReportDefinitionFilterDto } from './report-definition-filter.dto';
import { ReportDefinitionLayoutDto } from './report-definition-layout.dto';
import { ReportDefinitionParameterDto } from './report-definition-parameter.dto';
import { ReportDefinitionSectionDto } from './report-definition-section.dto';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class CreateReportDefinitionDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ example: 'monthly_sales_report' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  reportKey!: string;

  @ApiProperty({ example: 'Relatorio mensal de vendas' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Definicao declarativa para relatorio comercial mensal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ReportDefinitionStatus, default: ReportDefinitionStatus.Draft })
  @IsOptional()
  @IsEnum(ReportDefinitionStatus)
  status?: ReportDefinitionStatus;

  @ApiPropertyOptional({
    enum: ReportDefinitionVisibility,
    default: ReportDefinitionVisibility.Tenant,
  })
  @IsOptional()
  @IsEnum(ReportDefinitionVisibility)
  visibility?: ReportDefinitionVisibility;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  @IsOptional()
  @IsEntityId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  @IsOptional()
  @IsEntityId()
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ type: ReportDefinitionLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportDefinitionLayoutDto)
  layout?: ReportDefinitionLayoutDto;

  @ApiPropertyOptional({ type: [ReportDefinitionSectionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReportDefinitionSectionDto)
  sections?: ReportDefinitionSectionDto[];

  @ApiPropertyOptional({ type: [ReportDefinitionBlockDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReportDefinitionBlockDto)
  blocks?: ReportDefinitionBlockDto[];

  @ApiPropertyOptional({ type: [ReportDefinitionFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReportDefinitionFilterDto)
  filters?: ReportDefinitionFilterDto[];

  @ApiPropertyOptional({ type: [ReportDefinitionParameterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReportDefinitionParameterDto)
  parameters?: ReportDefinitionParameterDto[];

  @ApiPropertyOptional({ example: { defaultFormat: 'pdf', includeFilters: true } })
  @IsOptional()
  @IsObject()
  exportOptions?: Record<string, unknown>;

  @ApiPropertyOptional({ example: ['sales', 'monthly'] })
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
