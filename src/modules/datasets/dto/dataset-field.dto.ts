import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { DatasetFieldSemanticRole, DatasetFieldType } from '../schemas/dataset.constants';

export class DatasetFieldDto {
  @ApiProperty({ example: 'order_id' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  key!: string;

  @ApiProperty({ example: 'Codigo do pedido' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ enum: DatasetFieldType, example: DatasetFieldType.String })
  @IsEnum(DatasetFieldType)
  type!: DatasetFieldType;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 'Identificador do pedido' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiPropertyOptional({ example: '********1234' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sampleMasked?: string;

  @ApiPropertyOptional({ enum: DatasetFieldSemanticRole })
  @IsOptional()
  @IsEnum(DatasetFieldSemanticRole)
  semanticRole?: DatasetFieldSemanticRole;
}
