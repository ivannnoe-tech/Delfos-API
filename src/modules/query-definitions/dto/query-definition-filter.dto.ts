import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

import { SanitizedMetadataValue } from '../../../core/utils/sanitize-metadata';
import { QueryDefinitionFilterOperator } from '../schemas/query-definition.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class QueryDefinitionFilterDto {
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
    enum: QueryDefinitionFilterOperator,
    example: QueryDefinitionFilterOperator.DateRange,
  })
  @IsEnum(QueryDefinitionFilterOperator)
  operator!: QueryDefinitionFilterOperator;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 'last_30_days' })
  @IsOptional()
  defaultValue?: SanitizedMetadataValue;

  @ApiPropertyOptional({ example: ['open', 'closed'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  allowedValues?: SanitizedMetadataValue[];
}
