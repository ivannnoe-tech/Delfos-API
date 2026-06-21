import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { TenantStatus } from '../schemas/tenant.schema';

/**
 * Persistence-neutral tenant record returned by every {@link TenantsRepository}
 * implementation (Mongo or PostgreSQL). The service maps this to the response
 * DTO, so the REST contract is identical regardless of the backend
 * (ADR-0035 / ADR-0036).
 */
export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: SanitizedMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantRecord {
  name: string;
  slug: string;
  status?: TenantStatus;
  settings: SanitizedMetadata;
}

export type UpdateTenantRecord = Partial<CreateTenantRecord>;

/**
 * Repository contract for tenants. Implemented by `MongoTenantsRepository` and
 * `PostgresTenantsRepository`; the module selects one at runtime based on
 * whether `DELFOS_POSTGRES_URL` is configured. Used as the DI token.
 */
export abstract class TenantsRepository {
  abstract create(record: CreateTenantRecord): Promise<TenantRecord>;
  abstract findAll(page: number, pageSize: number): Promise<TenantRecord[]>;
  abstract countAll(): Promise<number>;
  abstract findById(id: string): Promise<TenantRecord | null>;
  abstract updateById(id: string, record: UpdateTenantRecord): Promise<TenantRecord | null>;
}
