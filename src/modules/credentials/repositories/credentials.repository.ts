import { CredentialStatus, CredentialType } from '../schemas/credential.constants';

/**
 * Persistence-neutral credential record returned by every
 * {@link CredentialsRepository} implementation (Mongo or PostgreSQL). The
 * service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 *
 * The protected secret value is intentionally **absent**: the Mongoose schema
 * marks `protectedSecretValue` as `select: false` and no read path ever loads
 * it, so the neutral record never carries it either. Reads must never leak the
 * secret.
 */
export interface CredentialRecord {
  id: string;
  tenantId: string;
  connectionId?: string;
  type: CredentialType;
  provider?: string;
  name: string;
  status: CredentialStatus;
  maskedPreview: string | null;
  rotatedAt?: Date;
  revokedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialRecord {
  tenantId: string;
  connectionId?: string;
  type: CredentialType;
  provider?: string;
  name: string;
  status?: CredentialStatus;
  maskedPreview: string | null;
  protectedSecretValue: string;
  protectionProvider: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CredentialFilters {
  tenantId: string;
  connectionId?: string;
}

export interface RotateCredentialRecord {
  maskedPreview: string | null;
  protectedSecretValue: string;
  protectionProvider: string;
  rotatedAt: Date;
  status: CredentialStatus.Active;
  updatedBy?: string;
}

export interface RevokeCredentialRecord {
  status: CredentialStatus.Revoked;
  revokedAt: Date;
  updatedBy?: string;
}

/**
 * Repository contract for credentials. Implemented by
 * `MongoCredentialsRepository` and `PostgresCredentialsRepository`; the module
 * selects one at runtime based on whether `DELFOS_POSTGRES_URL` is configured.
 * Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class CredentialsRepository {
  abstract create(record: CreateCredentialRecord): Promise<CredentialRecord>;
  abstract findByFilters(
    filters: CredentialFilters,
    page: number,
    pageSize: number,
  ): Promise<CredentialRecord[]>;
  abstract countByFilters(filters: CredentialFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<CredentialRecord | null>;
  abstract rotateByTenantAndId(
    tenantId: string,
    id: string,
    record: RotateCredentialRecord,
  ): Promise<CredentialRecord | null>;
  abstract revokeByTenantAndId(
    tenantId: string,
    id: string,
    record: RevokeCredentialRecord,
  ): Promise<CredentialRecord | null>;
}
