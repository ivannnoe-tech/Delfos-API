import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { QueryDefinitionAggregation } from '../schemas/query-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class QueryDefinitionMetricDto {
  @ApiProperty({ example: 'total_sales' })
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  key!: string;

  @ApiProperty({ example: 'Vendas totais' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 'total_amount' })
  @IsString()
  @MaxLength(160)
  field!: string;

  @ApiProperty({ enum: QueryDefinitionAggregation, example: QueryDefinitionAggregation.Sum })
  @IsEnum(QueryDefinitionAggregation)
  aggregation!: QueryDefinitionAggregation;

  @ApiPropertyOptional({ example: 'currency' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  format?: string;

  @ApiPropertyOptional({ example: 'Soma do valor total de vendas' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}
