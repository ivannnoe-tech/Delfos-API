import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  DatasetFieldSemanticRole,
  DatasetFieldType,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.constants';

export class DatasetFieldResponseDto {
  @ApiProperty({ example: 'order_id' })
  key!: string;

  @ApiProperty({ example: 'Codigo do pedido' })
  label!: string;

  @ApiProperty({ enum: DatasetFieldType })
  type!: DatasetFieldType;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ example: 'Identificador do pedido' })
  description?: string;

  @ApiPropertyOptional({ example: '********1234' })
  sampleMasked?: string;

  @ApiPropertyOptional({ enum: DatasetFieldSemanticRole })
  semanticRole?: DatasetFieldSemanticRole;
}

export class DatasetResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0501' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  connectionId?: string;

  @ApiProperty({ example: 'sales_orders' })
  datasetKey!: string;

  @ApiProperty({ example: 'Pedidos de venda' })
  name!: string;

  @ApiPropertyOptional({ example: 'Dataset logico para pedidos de venda' })
  description?: string;

  @ApiProperty({ enum: DatasetSourceType })
  sourceType!: DatasetSourceType;

  @ApiProperty({ enum: DatasetStatus })
  status!: DatasetStatus;

  @ApiProperty({ enum: DatasetRefreshMode })
  refreshMode!: DatasetRefreshMode;

  @ApiProperty({ enum: DatasetSchemaMode })
  schemaMode!: DatasetSchemaMode;

  @ApiProperty({ type: [DatasetFieldResponseDto] })
  fields!: DatasetFieldResponseDto[];

  @ApiProperty({ example: ['order_id'] })
  primaryKeyFields!: string[];

  @ApiPropertyOptional({ example: 'created_at' })
  timeField?: string;

  @ApiProperty({ example: ['sales', 'orders'] })
  tags!: string[];

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: { defaultPageSize: 50 } })
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

export class DatasetListResponseDto {
  @ApiProperty({ type: [DatasetResponseDto] })
  items!: DatasetResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
