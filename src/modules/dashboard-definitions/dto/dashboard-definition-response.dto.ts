import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata, SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';
import {
  DashboardDefinitionChartType,
  DashboardDefinitionFilterOperator,
  DashboardDefinitionLayoutDensity,
  DashboardDefinitionLayoutGap,
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../schemas/dashboard-definition.schema';

export class DashboardDefinitionLayoutResponseDto {
  @ApiProperty({ enum: DashboardDefinitionLayoutType })
  type!: DashboardDefinitionLayoutType;

  @ApiPropertyOptional({ example: 12 })
  columns?: number;

  @ApiPropertyOptional({ enum: DashboardDefinitionLayoutGap })
  gap?: DashboardDefinitionLayoutGap;

  @ApiPropertyOptional({ enum: DashboardDefinitionLayoutDensity })
  density?: DashboardDefinitionLayoutDensity;
}

export class DashboardDefinitionSectionResponseDto {
  @ApiProperty({ example: 'overview' })
  key!: string;

  @ApiProperty({ example: 'Visao geral' })
  title!: string;

  @ApiPropertyOptional({ example: 'Indicadores principais' })
  description?: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ type: DashboardDefinitionLayoutResponseDto })
  layout?: DashboardDefinitionLayoutResponseDto;
}

export class DashboardDefinitionWidgetSizeResponseDto {
  @ApiProperty({ example: 3 })
  cols!: number;

  @ApiProperty({ example: 1 })
  rows!: number;
}

export class DashboardDefinitionWidgetPositionResponseDto {
  @ApiProperty({ example: 0 })
  x!: number;

  @ApiProperty({ example: 0 })
  y!: number;
}

export class DashboardDefinitionVisualizationResponseDto {
  @ApiPropertyOptional({ enum: DashboardDefinitionChartType })
  chartType?: DashboardDefinitionChartType;

  @ApiPropertyOptional({ example: 'created_at' })
  xField?: string;

  @ApiProperty({ example: ['total_amount'] })
  yFields!: string[];

  @ApiPropertyOptional({ example: 'seller_name' })
  groupBy?: string;

  @ApiPropertyOptional({ example: 'currency' })
  format?: string;
}

export class DashboardDefinitionWidgetResponseDto {
  @ApiProperty({ example: 'total_sales' })
  key!: string;

  @ApiProperty({ example: 'Vendas totais' })
  title!: string;

  @ApiPropertyOptional({ example: 'Soma das vendas do periodo' })
  description?: string;

  @ApiProperty({ enum: DashboardDefinitionWidgetType })
  type!: DashboardDefinitionWidgetType;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: 'overview' })
  sectionKey?: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ type: DashboardDefinitionWidgetSizeResponseDto })
  size?: DashboardDefinitionWidgetSizeResponseDto;

  @ApiPropertyOptional({ type: DashboardDefinitionWidgetPositionResponseDto })
  position?: DashboardDefinitionWidgetPositionResponseDto;

  @ApiPropertyOptional({ type: DashboardDefinitionVisualizationResponseDto })
  visualization?: DashboardDefinitionVisualizationResponseDto;

  @ApiProperty({ example: { showTrend: true } })
  options!: SanitizedMetadata;
}

export class DashboardDefinitionFilterResponseDto {
  @ApiProperty({ example: 'period' })
  key!: string;

  @ApiProperty({ example: 'Periodo' })
  label!: string;

  @ApiProperty({ example: 'created_at' })
  field!: string;

  @ApiProperty({ enum: DashboardDefinitionFilterOperator })
  operator!: DashboardDefinitionFilterOperator;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  defaultValue?: SanitizedMetadataValue;

  @ApiProperty({ example: ['last_7_days', 'last_30_days'] })
  allowedValues!: SanitizedMetadataValue[];
}

export class DashboardDefinitionResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0701' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: 'sales_dashboard' })
  dashboardKey!: string;

  @ApiProperty({ example: 'Dashboard de vendas' })
  name!: string;

  @ApiPropertyOptional({ example: 'Painel logico para acompanhamento comercial' })
  description?: string;

  @ApiProperty({ enum: DashboardDefinitionStatus })
  status!: DashboardDefinitionStatus;

  @ApiProperty({ enum: DashboardDefinitionVisibility })
  visibility!: DashboardDefinitionVisibility;

  @ApiProperty({ type: DashboardDefinitionLayoutResponseDto })
  layout!: DashboardDefinitionLayoutResponseDto;

  @ApiProperty({ type: [DashboardDefinitionSectionResponseDto] })
  sections!: DashboardDefinitionSectionResponseDto[];

  @ApiProperty({ type: [DashboardDefinitionWidgetResponseDto] })
  widgets!: DashboardDefinitionWidgetResponseDto[];

  @ApiProperty({ type: [DashboardDefinitionFilterResponseDto] })
  filters!: DashboardDefinitionFilterResponseDto[];

  @ApiProperty({ example: ['sales', 'overview'] })
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

export class DashboardDefinitionListResponseDto {
  @ApiProperty({ type: [DashboardDefinitionResponseDto] })
  items!: DashboardDefinitionResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
