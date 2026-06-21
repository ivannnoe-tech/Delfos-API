import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

import { QueryDefinitionSortDirection } from '../schemas/query-definition.constants';

export class QueryDefinitionSortDto {
  @ApiProperty({ example: 'total_amount' })
  @IsString()
  @MaxLength(160)
  field!: string;

  @ApiProperty({ enum: QueryDefinitionSortDirection, example: QueryDefinitionSortDirection.Desc })
  @IsEnum(QueryDefinitionSortDirection)
  direction!: QueryDefinitionSortDirection;
}
