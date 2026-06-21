import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.constants';
import { ReportDefinitionBlockResponseDto } from './report-definition-block.dto';
import { ReportDefinitionFilterResponseDto } from './report-definition-filter.dto';
import { ReportDefinitionLayoutResponseDto } from './report-definition-layout.dto';
import { ReportDefinitionParameterResponseDto } from './report-definition-parameter.dto';
import { ReportDefinitionSectionResponseDto } from './report-definition-section.dto';

export class ReportDefinitionResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0801' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: 'monthly_sales_report' })
  reportKey!: string;

  @ApiProperty({ example: 'Relatorio mensal de vendas' })
  name!: string;

  @ApiPropertyOptional({ example: 'Definicao declarativa para relatorio comercial mensal' })
  description?: string;

  @ApiProperty({ enum: ReportDefinitionStatus })
  status!: ReportDefinitionStatus;

  @ApiProperty({ enum: ReportDefinitionVisibility })
  visibility!: ReportDefinitionVisibility;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  dashboardDefinitionId?: string;

  @ApiProperty({ type: ReportDefinitionLayoutResponseDto })
  layout!: ReportDefinitionLayoutResponseDto;

  @ApiProperty({ type: [ReportDefinitionSectionResponseDto] })
  sections!: ReportDefinitionSectionResponseDto[];

  @ApiProperty({ type: [ReportDefinitionBlockResponseDto] })
  blocks!: ReportDefinitionBlockResponseDto[];

  @ApiProperty({ type: [ReportDefinitionFilterResponseDto] })
  filters!: ReportDefinitionFilterResponseDto[];

  @ApiProperty({ type: [ReportDefinitionParameterResponseDto] })
  parameters!: ReportDefinitionParameterResponseDto[];

  @ApiProperty({ example: { defaultFormat: 'pdf', includeFilters: true } })
  exportOptions!: SanitizedMetadata;

  @ApiProperty({ example: ['sales', 'monthly'] })
  tags!: string[];

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: { visibleInBuilder: true } })
  settings!: SanitizedMetadata;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  updatedBy?: string;
}

export class ReportDefinitionListResponseDto {
  @ApiProperty({ type: [ReportDefinitionResponseDto] })
  items!: ReportDefinitionResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
