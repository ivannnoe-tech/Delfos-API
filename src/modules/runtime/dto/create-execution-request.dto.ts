import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsObject, IsOptional } from 'class-validator';

import { ExecutionRequestKind, ExecutionRequestMode } from '../schemas/execution-request.schema';

export class CreateExecutionRequestDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiProperty({ enum: ExecutionRequestKind, example: ExecutionRequestKind.Query })
  @IsEnum(ExecutionRequestKind)
  kind!: ExecutionRequestKind;

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

  @ApiPropertyOptional({
    enum: ExecutionRequestMode,
    default: ExecutionRequestMode.FutureRuntime,
  })
  @IsOptional()
  @IsEnum(ExecutionRequestMode)
  mode?: ExecutionRequestMode;

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
