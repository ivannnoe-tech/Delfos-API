import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { DatasetSourceType, DatasetStatus } from '../schemas/dataset.constants';

export class ListDatasetsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;

  @ApiPropertyOptional({ example: 'sales_orders' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
  datasetKey?: string;

  @ApiPropertyOptional({ enum: DatasetStatus })
  @IsOptional()
  @IsEnum(DatasetStatus)
  status?: DatasetStatus;

  @ApiPropertyOptional({ enum: DatasetSourceType })
  @IsOptional()
  @IsEnum(DatasetSourceType)
  sourceType?: DatasetSourceType;
}

export class DatasetTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
