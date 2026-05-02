import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';

export class CreateExecutionRequestEventDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiProperty({
    enum: ExecutionRequestEventType,
    example: ExecutionRequestEventType.StatusChanged,
  })
  @IsEnum(ExecutionRequestEventType)
  eventType!: ExecutionRequestEventType;

  @ApiPropertyOptional({
    enum: ExecutionRequestStatus,
    example: ExecutionRequestStatus.Blocked,
  })
  @IsOptional()
  @IsEnum(ExecutionRequestStatus)
  nextStatus?: ExecutionRequestStatus;

  @ApiPropertyOptional({
    example: 'Request blocked by foundation validation. No runtime was started.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ example: 'runtime_foundation_only' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;

  @ApiPropertyOptional({ example: { domain: 'sales' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
