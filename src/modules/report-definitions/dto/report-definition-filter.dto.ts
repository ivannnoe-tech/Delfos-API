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
import { ReportDefinitionFilterOperator } from '../schemas/report-definition.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ReportDefinitionFilterDto {
  @ApiProperty({ example: 'period' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Periodo' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 'created_at' })
  @IsString()
  @MaxLength(160)
  field!: string;

  @ApiProperty({
    enum: ReportDefinitionFilterOperator,
    example: ReportDefinitionFilterOperator.DateRange,
  })
  @IsEnum(ReportDefinitionFilterOperator)
  operator!: ReportDefinitionFilterOperator;

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

export class ReportDefinitionFilterResponseDto {
  @ApiProperty({ example: 'period' })
  key!: string;

  @ApiProperty({ example: 'Periodo' })
  label!: string;

  @ApiProperty({ example: 'created_at' })
  field!: string;

  @ApiProperty({ enum: ReportDefinitionFilterOperator })
  operator!: ReportDefinitionFilterOperator;

  @ApiProperty({ example: true })
  required!: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  defaultValue?: SanitizedMetadataValue;

  @ApiProperty({ example: ['last_7_days', 'last_30_days'] })
  allowedValues!: SanitizedMetadataValue[];
}
