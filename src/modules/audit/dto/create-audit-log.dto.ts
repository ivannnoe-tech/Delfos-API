import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';

export class CreateAuditLogDto {
  @IsEntityId()
  tenantId!: string;

  @IsOptional()
  @IsEntityId()
  actorUserId?: string;

  @IsString()
  @MaxLength(120)
  action!: string;

  @IsString()
  @MaxLength(80)
  entity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
