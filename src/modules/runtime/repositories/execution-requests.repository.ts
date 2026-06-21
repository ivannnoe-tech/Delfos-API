import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

/**
 * Persistence-neutral execution request record returned by every
 * {@link ExecutionRequestsRepository} implementation (Mongo or PostgreSQL).
 * Ids are opaque strings and dates are `Date`s, so the record is identical
 * regardless of the backend (ADR-0035 / ADR-0036). The service maps this to the
 * response DTO and passes it to the audit/readiness/event services.
 */
export interface ExecutionRequestRecord {
  id: string;
  tenantId: string;
  requestKey: string;
  kind: ExecutionRequestKind;
  status: ExecutionRequestStatus;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  connectionId?: string;
  datasetId?: string;
  requestedByActorId?: string;
  requestedByRole?: AdminRole;
  mode: ExecutionRequestMode;
  reason?: string;
  message?: string;
  metadata: SanitizedMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExecutionRequestRecord {
  tenantId: string;
  requestKey: string;
  kind: ExecutionRequestKind;
  status: ExecutionRequestStatus;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  connectionId?: string;
  datasetId?: string;
  requestedByActorId?: string;
  requestedByRole?: AdminRole;
  mode: ExecutionRequestMode;
  reason?: string;
  message?: string;
  metadata: SanitizedMetadata;
}

export interface ExecutionRequestFilters {
  tenantId: string;
  kind?: ExecutionRequestKind;
  status?: ExecutionRequestStatus;
  mode?: ExecutionRequestMode;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  connectionId?: string;
  datasetId?: string;
}

/**
 * Repository contract for execution requests. Implemented by
 * `MongoExecutionRequestsRepository` and `PostgresExecutionRequestsRepository`;
 * the module selects one at runtime based on whether `DELFOS_POSTGRES_URL` is
 * configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class ExecutionRequestsRepository {
  abstract create(record: CreateExecutionRequestRecord): Promise<ExecutionRequestRecord>;
  abstract findByFilters(
    filters: ExecutionRequestFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestRecord[]>;
  abstract countByFilters(filters: ExecutionRequestFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<ExecutionRequestRecord | null>;
  abstract updateStatusByTenantAndId(
    tenantId: string,
    id: string,
    status: ExecutionRequestStatus,
  ): Promise<ExecutionRequestRecord | null>;
}
