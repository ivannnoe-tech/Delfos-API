import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export class ExecutionRequestResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0901' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: 'exec_req_662d4f6e7a1c2b00124f0901' })
  requestKey!: string;

  @ApiProperty({ enum: ExecutionRequestKind })
  kind!: ExecutionRequestKind;

  @ApiProperty({ enum: ExecutionRequestStatus })
  status!: ExecutionRequestStatus;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  dashboardDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0801' })
  reportDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  connectionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0501' })
  datasetId?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  requestedByActorId?: string;

  @ApiPropertyOptional({ enum: AdminRole })
  requestedByRole?: AdminRole;

  @ApiProperty({ enum: ExecutionRequestMode })
  mode!: ExecutionRequestMode;

  @ApiPropertyOptional({ example: 'runtime_foundation_only' })
  reason?: string;

  @ApiPropertyOptional({
    example: 'Runtime foundation request accepted. No real execution was started.',
  })
  message?: string;

  @ApiProperty({ example: { domain: 'sales' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ example: '2026-05-02T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-02T12:00:00.000Z' })
  updatedAt!: string;
}

export class ExecutionRequestListResponseDto {
  @ApiProperty({ type: [ExecutionRequestResponseDto] })
  items!: ExecutionRequestResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
