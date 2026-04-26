import { ApiProperty } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { ConnectionAuthType, ConnectionStatus, ConnectionType } from '../schemas/connection.schema';

export class ConnectionResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0201' })
  id!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiProperty({ example: 'Primary customer API' })
  name!: string;

  @ApiProperty({ enum: ConnectionType })
  type!: ConnectionType;

  @ApiProperty({ example: 'https://api.customer.example' })
  baseUrl!: string;

  @ApiProperty({ enum: ConnectionAuthType })
  authType!: ConnectionAuthType;

  @ApiProperty({ example: true })
  hasCredentialReference!: boolean;

  @ApiProperty({ example: ['x-client-id'] })
  allowedHeaders!: string[];

  @ApiProperty({ example: { environment: 'sandbox' } })
  metadata!: SanitizedMetadata;

  @ApiProperty({ enum: ConnectionStatus })
  status!: ConnectionStatus;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;
}

export class ConnectionListResponseDto {
  @ApiProperty({ type: [ConnectionResponseDto] })
  items!: ConnectionResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
