import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.schema';

export class FieldMappingResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0301' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  connectionId?: string;

  @ApiProperty({ example: 'sales' })
  datasetKey!: string;

  @ApiProperty({ example: 'order.total' })
  sourcePath!: string;

  @ApiProperty({ example: 'totalAmount' })
  targetField!: string;

  @ApiProperty({ enum: FieldMappingTargetType })
  targetType!: FieldMappingTargetType;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ enum: FieldMappingTransform })
  transform?: FieldMappingTransform;

  @ApiProperty({ enum: FieldMappingStatus })
  status!: FieldMappingStatus;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;
}

export class FieldMappingListResponseDto {
  @ApiProperty({ type: [FieldMappingResponseDto] })
  items!: FieldMappingResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
