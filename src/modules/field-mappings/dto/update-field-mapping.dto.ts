import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.schema';

export class UpdateFieldMappingDto {
  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;

  @ApiPropertyOptional({ example: 'sales' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  datasetKey?: string;

  @ApiPropertyOptional({ example: 'order.total' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sourcePath?: string;

  @ApiPropertyOptional({ example: 'totalAmount' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetField?: string;

  @ApiPropertyOptional({ enum: FieldMappingTargetType })
  @IsOptional()
  @IsEnum(FieldMappingTargetType)
  targetType?: FieldMappingTargetType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ enum: FieldMappingTransform })
  @IsOptional()
  @IsEnum(FieldMappingTransform)
  transform?: FieldMappingTransform;

  @ApiPropertyOptional({ enum: FieldMappingStatus })
  @IsOptional()
  @IsEnum(FieldMappingStatus)
  status?: FieldMappingStatus;
}
