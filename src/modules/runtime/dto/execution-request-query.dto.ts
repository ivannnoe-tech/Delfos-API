import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export class ListExecutionRequestsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiPropertyOptional({ enum: ExecutionRequestKind })
  @IsOptional()
  @IsEnum(ExecutionRequestKind)
  kind?: ExecutionRequestKind;

  @ApiPropertyOptional({ enum: ExecutionRequestStatus })
  @IsOptional()
  @IsEnum(ExecutionRequestStatus)
  status?: ExecutionRequestStatus;

  @ApiPropertyOptional({ enum: ExecutionRequestMode })
  @IsOptional()
  @IsEnum(ExecutionRequestMode)
  mode?: ExecutionRequestMode;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  @IsOptional()
  @IsMongoId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  @IsOptional()
  @IsMongoId()
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0801' })
  @IsOptional()
  @IsMongoId()
  reportDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsMongoId()
  connectionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0501' })
  @IsOptional()
  @IsMongoId()
  datasetId?: string;
}

export class ExecutionRequestTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;
}
