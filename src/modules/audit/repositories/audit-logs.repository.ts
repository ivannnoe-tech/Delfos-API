import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

/**
 * Persistence-neutral audit-log record returned by every
 * {@link AuditLogsRepository} implementation (Mongo or PostgreSQL). The service
 * maps this to the response DTO, so the REST contract is identical regardless of
 * the backend (ADR-0035 / ADR-0036). `timestamp` maps to the Mongo `timestamp`
 * field and the PostgreSQL `created_at` column; audit logs are immutable, so
 * there is no `updatedAt`.
 */
export interface AuditLogRecord {
  id: string;
  tenantId: string;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata: SanitizedMetadata;
  timestamp: Date;
}

export interface CreateAuditLogRecord {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata: SanitizedMetadata;
}

/**
 * Repository contract for audit logs. Implemented by `MongoAuditLogsRepository`
 * and `PostgresAuditLogsRepository`; the module selects one at runtime based on
 * whether `DELFOS_POSTGRES_URL` is configured. Used as the DI token. Every query
 * is tenant-scoped — `tenantId` is the mandatory isolation boundary.
 */
export abstract class AuditLogsRepository {
  abstract create(record: CreateAuditLogRecord): Promise<AuditLogRecord>;
}
