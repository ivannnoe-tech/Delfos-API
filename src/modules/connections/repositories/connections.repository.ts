import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  ConnectionAuthType,
  ConnectionStatus,
  ConnectionType,
} from '../schemas/connection.constants';

/**
 * Persistence-neutral connection record returned by every
 * {@link ConnectionsRepository} implementation (Mongo or PostgreSQL). The
 * service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface ConnectionRecord {
  id: string;
  tenantId: string;
  name: string;
  type: ConnectionType;
  baseUrl: string;
  authType: ConnectionAuthType;
  credentialRef?: string;
  allowedHeaders: string[];
  metadata: SanitizedMetadata;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConnectionRecord {
  tenantId: string;
  name: string;
  type?: ConnectionType;
  baseUrl: string;
  authType?: ConnectionAuthType;
  credentialRef?: string;
  allowedHeaders: string[];
  metadata: SanitizedMetadata;
  status?: ConnectionStatus;
}

export type UpdateConnectionRecord = Partial<Omit<CreateConnectionRecord, 'tenantId'>>;

/**
 * Repository contract for connections. Implemented by
 * `MongoConnectionsRepository` and `PostgresConnectionsRepository`; the module
 * selects one at runtime based on whether `DELFOS_POSTGRES_URL` is configured.
 * Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class ConnectionsRepository {
  abstract create(record: CreateConnectionRecord): Promise<ConnectionRecord>;
  abstract findByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ConnectionRecord[]>;
  abstract countByTenant(tenantId: string): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<ConnectionRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateConnectionRecord,
  ): Promise<ConnectionRecord | null>;
}
