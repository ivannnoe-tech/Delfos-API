import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { DB, Users } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { UserRole, UserStatus } from '../schemas/user.constants';
import {
  CreateUserRecord,
  UpdateUserRecord,
  UserRecord,
  UsersRepository,
} from './users.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UsersRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: UsersRow): UserRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresUsersRepository extends UsersRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error('PostgresUsersRepository used without a configured PostgreSQL connection.');
    }
    return this.kysely;
  }

  async create(record: CreateUserRecord): Promise<UserRecord> {
    const values: Insertable<Users> = {
      tenant_id: record.tenantId,
      name: record.name,
      email: record.email,
    };
    if (record.role !== undefined) {
      values.role = record.role;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }

    const row = await this.db
      .insertInto('users')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByTenant(tenantId: string, page: number, pageSize: number): Promise<UserRecord[]> {
    if (!UUID_RE.test(tenantId)) {
      return [];
    }

    const rows = await this.db
      .selectFrom('users')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByTenant(tenantId: string): Promise<number> {
    if (!UUID_RE.test(tenantId)) {
      return 0;
    }

    const result = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', tenantId)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateUserRecord,
  ): Promise<UserRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Users> = {};
    if (record.name !== undefined) {
      updates.name = record.name;
    }
    if (record.email !== undefined) {
      updates.email = record.email;
    }
    if (record.role !== undefined) {
      updates.role = record.role;
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }

    const row = await this.db
      .updateTable('users')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }
}
