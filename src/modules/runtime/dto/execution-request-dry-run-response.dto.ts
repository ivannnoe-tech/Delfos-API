import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';

export class ExecutionRequestReadinessItemDto {
  @ApiProperty({ example: 'query_definition_found' })
  code!: string;

  @ApiProperty({ example: 'Query definition exists for this tenant.' })
  message!: string;

  @ApiPropertyOptional({ example: 'queryDefinitionId' })
  target?: string;
}

export class ExecutionRequestDryRunResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0901' })
  executionRequestId!: string;

  @ApiProperty({ example: 'exec_req_662d4f6e7a1c2b00124f0901' })
  requestKey!: string;

  @ApiProperty({ enum: ExecutionRequestKind })
  kind!: ExecutionRequestKind;

  @ApiProperty({ enum: ExecutionRequestStatus })
  recommendedStatus!: ExecutionRequestStatus;

  @ApiProperty({ example: true })
  ready!: boolean;

  @ApiProperty({ type: [ExecutionRequestReadinessItemDto] })
  checks!: ExecutionRequestReadinessItemDto[];

  @ApiProperty({ type: [ExecutionRequestReadinessItemDto] })
  warnings!: ExecutionRequestReadinessItemDto[];

  @ApiProperty({ type: [ExecutionRequestReadinessItemDto] })
  blockers!: ExecutionRequestReadinessItemDto[];

  @ApiProperty({ enum: [ExecutionRequestMode.DryRun], example: ExecutionRequestMode.DryRun })
  mode!: ExecutionRequestMode.DryRun;

  @ApiProperty({
    example:
      'Dry-run readiness checked declarative contracts only. No real runtime execution was started.',
  })
  message!: string;

  @ApiProperty({ example: 'dry_run_readiness_checked' })
  reason!: string;
}
