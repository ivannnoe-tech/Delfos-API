import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { ExecutionRequestKind, ExecutionRequestMode } from '../schemas/execution-request.schema';

export class CreateExecutionRequestDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ enum: ExecutionRequestKind, example: ExecutionRequestKind.Query })
  @IsEnum(ExecutionRequestKind)
  kind!: ExecutionRequestKind;

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
