import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';

export class ExecutionRequestEventResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0902' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0901' })
  executionRequestId!: string;

  @ApiProperty({ example: 'exec_req_662d4f6e7a1c2b00124f0901' })
  requestKey!: string;

  @ApiProperty({ enum: ExecutionRequestEventType })
  eventType!: ExecutionRequestEventType;

  @ApiPropertyOptional({ enum: ExecutionRequestStatus })
  previousStatus?: ExecutionRequestStatus;

  @ApiPropertyOptional({ enum: ExecutionRequestStatus })
  nextStatus?: ExecutionRequestStatus;

  @ApiPropertyOptional({
    example: 'Runtime foundation request accepted. No real execution was started.',
  })
  message?: string;

  @ApiPropertyOptional({ example: 'runtime_foundation_only' })
  reason?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  actorId?: string;

  @ApiPropertyOptional({ enum: AdminRole })
  actorRole?: AdminRole;

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: '2026-05-02T12:00:00.000Z' })
  createdAt!: string;
}

export class ExecutionRequestEventListResponseDto {
  @ApiProperty({ type: [ExecutionRequestEventResponseDto] })
  items!: ExecutionRequestEventResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
