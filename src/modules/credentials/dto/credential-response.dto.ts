import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { CredentialStatus, CredentialType } from '../schemas/credential.schema';

export class CredentialResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0401' })
  id!: string;

  @ApiProperty({ example: 'cred_662d4f6e7a1c2b00124f0401' })
  credentialRef!: string;

  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  connectionId?: string;

  @ApiProperty({ enum: CredentialType })
  type!: CredentialType;

  @ApiPropertyOptional({ example: 'customer-api' })
  provider?: string;

  @ApiProperty({ example: 'Primary customer API credential' })
  name!: string;

  @ApiProperty({ enum: CredentialStatus })
  status!: CredentialStatus;

  @ApiPropertyOptional({ example: '********1234', nullable: true })
  maskedPreview!: string | null;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: '2026-04-26T12:30:00.000Z' })
  rotatedAt?: string;

  @ApiPropertyOptional({ example: '2026-04-26T13:00:00.000Z' })
  revokedAt?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'dev-actor-001' })
  updatedBy?: string;
}

export class CredentialListResponseDto {
  @ApiProperty({ type: [CredentialResponseDto] })
  items!: CredentialResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
