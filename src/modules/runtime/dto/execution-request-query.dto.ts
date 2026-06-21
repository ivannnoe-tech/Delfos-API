import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export class ListExecutionRequestsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
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
  @IsEntityId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  @IsOptional()
  @IsEntityId()
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0801' })
  @IsOptional()
  @IsEntityId()
  reportDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0501' })
  @IsOptional()
  @IsEntityId()
  datasetId?: string;
}

export class ExecutionRequestTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
