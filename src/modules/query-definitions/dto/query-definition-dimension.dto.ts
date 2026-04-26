import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { QueryDefinitionDimensionType } from '../schemas/query-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class QueryDefinitionDimensionDto {
  @ApiProperty({ example: 'seller' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Vendedor' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 'seller_name' })
  @IsString()
  @MaxLength(160)
  field!: string;

  @ApiProperty({ enum: QueryDefinitionDimensionType })
  @IsEnum(QueryDefinitionDimensionType)
  type!: QueryDefinitionDimensionType;

  @ApiPropertyOptional({ example: 'Nome do vendedor' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}
