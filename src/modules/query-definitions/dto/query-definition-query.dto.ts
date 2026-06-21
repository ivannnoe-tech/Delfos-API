import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { QueryDefinitionStatus, QueryDefinitionType } from '../schemas/query-definition.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ListQueryDefinitionsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0501' })
  @IsOptional()
  @IsEntityId()
  datasetId?: string;

  @ApiPropertyOptional({ example: 'sales_overview' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  queryKey?: string;

  @ApiPropertyOptional({ enum: QueryDefinitionStatus })
  @IsOptional()
  @IsEnum(QueryDefinitionStatus)
  status?: QueryDefinitionStatus;

  @ApiPropertyOptional({ enum: QueryDefinitionType })
  @IsOptional()
  @IsEnum(QueryDefinitionType)
  type?: QueryDefinitionType;
}

export class QueryDefinitionTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
