import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.schema';

export class CreateFieldMappingDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsMongoId()
  connectionId?: string;

  @ApiProperty({ example: 'sales' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  datasetKey!: string;

  @ApiProperty({ example: 'order.total' })
  @IsString()
  @MaxLength(160)
  sourcePath!: string;

  @ApiProperty({ example: 'totalAmount' })
  @IsString()
  @MaxLength(120)
  targetField!: string;

  @ApiProperty({ enum: FieldMappingTargetType })
  @IsEnum(FieldMappingTargetType)
  targetType!: FieldMappingTargetType;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ enum: FieldMappingTransform })
  @IsOptional()
  @IsEnum(FieldMappingTransform)
  transform?: FieldMappingTransform;

  @ApiPropertyOptional({ enum: FieldMappingStatus, default: FieldMappingStatus.Active })
  @IsOptional()
  @IsEnum(FieldMappingStatus)
  status?: FieldMappingStatus;
}
