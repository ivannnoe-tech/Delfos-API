import { IsMongoId, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
  @IsMongoId()
  tenantId!: string;

  @IsOptional()
  @IsMongoId()
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
