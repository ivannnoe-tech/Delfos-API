import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';

/**
 * Persistence-neutral execution request event record returned by every
 * {@link ExecutionRequestEventsRepository} implementation (Mongo or
 * PostgreSQL). Events are immutable and only carry `createdAt`. Ids are opaque
 * strings, so the record is identical regardless of the backend
 * (ADR-0035 / ADR-0036).
 */
export interface ExecutionRequestEventRecord {
  id: string;
  tenantId: string;
  executionRequestId: string;
  requestKey: string;
  eventType: ExecutionRequestEventType;
  previousStatus?: ExecutionRequestStatus;
  nextStatus?: ExecutionRequestStatus;
  message?: string;
  reason?: string;
  actorId?: string;
  actorRole?: AdminRole;
  metadata: SanitizedMetadata;
  createdAt: Date;
}

export interface CreateExecutionRequestEventRecord {
  tenantId: string;
  executionRequestId: string;
  requestKey: string;
  eventType: ExecutionRequestEventType;
  previousStatus?: ExecutionRequestStatus;
  nextStatus?: ExecutionRequestStatus;
  message?: string;
  reason?: string;
  actorId?: string;
  actorRole?: AdminRole;
  metadata: SanitizedMetadata;
}

export interface ExecutionRequestEventFilters {
  tenantId: string;
  executionRequestId: string;
  eventType?: ExecutionRequestEventType;
}

/**
 * Repository contract for execution request events. Implemented by
 * `MongoExecutionRequestEventsRepository` and
 * `PostgresExecutionRequestEventsRepository`; the module selects one at runtime
 * based on whether `DELFOS_POSTGRES_URL` is configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class ExecutionRequestEventsRepository {
  abstract create(record: CreateExecutionRequestEventRecord): Promise<ExecutionRequestEventRecord>;
  abstract findByFilters(
    filters: ExecutionRequestEventFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestEventRecord[]>;
  abstract countByFilters(filters: ExecutionRequestEventFilters): Promise<number>;
}
