import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

export class AuditLogResponseDto {
  id!: string;
  tenantId!: string;
  actorUserId?: string;
  action!: string;
  entity!: string;
  entityId?: string;
  metadata!: SanitizedMetadata;
  timestamp!: string;
}
