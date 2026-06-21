import { ApiProperty } from '@nestjs/swagger';

import { ListMetaDto } from '../../../core/dto/list-meta.dto';
import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { TenantStatus } from '../schemas/tenant.constants';

export class TenantResponseDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  id!: string;

  @ApiProperty({ example: 'Acme Analytics' })
  name!: string;

  @ApiProperty({ example: 'acme-analytics' })
  slug!: string;

  @ApiProperty({ enum: TenantStatus })
  status!: TenantStatus;

  @ApiProperty({ example: { onboardingStage: 'foundation' } })
  settings!: SanitizedMetadata;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  updatedAt!: string;
}

export class TenantListResponseDto {
  @ApiProperty({ type: [TenantResponseDto] })
  items!: TenantResponseDto[];

  @ApiProperty({ type: ListMetaDto })
  meta!: ListMetaDto;
}
