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
import { DatasetFieldDto } from './dataset-field.dto';
import {
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.schema';

export class CreateDatasetDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;

  @ApiProperty({ example: 'sales_orders' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  datasetKey!: string;

  @ApiProperty({ example: 'Pedidos de venda' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Dataset logico para pedidos de venda' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: DatasetSourceType, default: DatasetSourceType.Api })
  @IsOptional()
  @IsEnum(DatasetSourceType)
  sourceType?: DatasetSourceType;

  @ApiPropertyOptional({ enum: DatasetStatus, default: DatasetStatus.Draft })
  @IsOptional()
  @IsEnum(DatasetStatus)
  status?: DatasetStatus;

  @ApiPropertyOptional({ enum: DatasetRefreshMode, default: DatasetRefreshMode.Manual })
  @IsOptional()
  @IsEnum(DatasetRefreshMode)
  refreshMode?: DatasetRefreshMode;

  @ApiPropertyOptional({ enum: DatasetSchemaMode, default: DatasetSchemaMode.Declared })
  @IsOptional()
  @IsEnum(DatasetSchemaMode)
  schemaMode?: DatasetSchemaMode;

  @ApiPropertyOptional({ type: [DatasetFieldDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => DatasetFieldDto)
  fields?: DatasetFieldDto[];

  @ApiPropertyOptional({ example: ['order_id'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, { each: true })
  primaryKeyFields?: string[];

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  timeField?: string;

  @ApiPropertyOptional({ example: ['sales', 'orders'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { defaultPageSize: 50 } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
