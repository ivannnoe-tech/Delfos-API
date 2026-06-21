import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { TenantStatus } from '../schemas/tenant.constants';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Analytics' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'acme-analytics' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional({ enum: TenantStatus, default: TenantStatus.Active })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({
    example: { onboardingStage: 'foundation' },
    description: 'Sanitized non-sensitive tenant metadata only.',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
