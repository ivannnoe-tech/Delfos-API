import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';
import { ReportDefinitionParameterType } from '../schemas/report-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ReportDefinitionParameterDto {
  @ApiProperty({ example: 'tenant_period' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Periodo do relatorio' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({
    enum: ReportDefinitionParameterType,
    example: ReportDefinitionParameterType.DateRange,
  })
  @IsEnum(ReportDefinitionParameterType)
  type!: ReportDefinitionParameterType;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  @IsOptional()
  defaultValue?: SanitizedMetadataValue;

  @ApiPropertyOptional({ example: ['last_7_days', 'last_30_days'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  allowedValues?: SanitizedMetadataValue[];
}

export class ReportDefinitionParameterResponseDto {
  @ApiProperty({ example: 'tenant_period' })
  key!: string;

  @ApiProperty({ example: 'Periodo do relatorio' })
  label!: string;

  @ApiProperty({ enum: ReportDefinitionParameterType })
  type!: ReportDefinitionParameterType;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  defaultValue?: SanitizedMetadataValue;

  @ApiProperty({ example: ['last_7_days', 'last_30_days'] })
  allowedValues!: SanitizedMetadataValue[];
}
