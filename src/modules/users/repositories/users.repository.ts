import { UserRole, UserStatus } from '../schemas/user.schema';

/**
 * Persistence-neutral user record returned by every {@link UsersRepository}
 * implementation (Mongo or PostgreSQL). The service maps this to the response
 * DTO, so the REST contract is identical regardless of the backend
 * (ADR-0035 / ADR-0036).
 */
export interface UserRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRecord {
  tenantId: string;
  name: string;
  email: string;
  role?: UserRole;
  status?: UserStatus;
}

export type UpdateUserRecord = Partial<Omit<CreateUserRecord, 'tenantId'>>;

/**
 * Repository contract for users. Implemented by `MongoUsersRepository` and
 * `PostgresUsersRepository`; the module selects one at runtime based on whether
 * `DELFOS_POSTGRES_URL` is configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class UsersRepository {
  abstract create(record: CreateUserRecord): Promise<UserRecord>;
  abstract findByTenant(tenantId: string, page: number, pageSize: number): Promise<UserRecord[]>;
  abstract countByTenant(tenantId: string): Promise<number>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateUserRecord,
  ): Promise<UserRecord | null>;
}
