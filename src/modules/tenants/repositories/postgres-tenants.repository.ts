import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, Tenants } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { TenantStatus } from '../schemas/tenant.schema';
import {
  CreateTenantRecord,
  TenantRecord,
  TenantsRepository,
  UpdateTenantRecord,
} from './tenants.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TenantsRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: unknown;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: TenantsRow): TenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status as TenantStatus,
    settings: (row.settings ?? {}) as SanitizedMetadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresTenantsRepository extends TenantsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error('PostgresTenantsRepository used without a configured PostgreSQL connection.');
    }
    return this.kysely;
  }

  async create(record: CreateTenantRecord): Promise<TenantRecord> {
    const values: Insertable<Tenants> = {
      name: record.name,
      slug: record.slug,
      settings: JSON.stringify(record.settings),
    };
    if (record.status !== undefined) {
      values.status = record.status;
    }

    const row = await this.db
      .insertInto('tenants')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findAll(page: number, pageSize: number): Promise<TenantRecord[]> {
    const rows = await this.db
      .selectFrom('tenants')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countAll(): Promise<number> {
    const result = await this.db
      .selectFrom('tenants')
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findById(id: string): Promise<TenantRecord | null> {
    if (!UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('tenants')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateById(id: string, record: UpdateTenantRecord): Promise<TenantRecord | null> {
    if (!UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Tenants> = {};
    if (record.name !== undefined) {
      updates.name = record.name;
    }
    if (record.slug !== undefined) {
      updates.slug = record.slug;
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }
    if (record.settings !== undefined) {
      updates.settings = JSON.stringify(record.settings);
    }

    const row = await this.db
      .updateTable('tenants')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }
}
