import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { Connections, DB } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { ConnectionAuthType, ConnectionStatus, ConnectionType } from '../schemas/connection.schema';
import {
  ConnectionRecord,
  ConnectionsRepository,
  CreateConnectionRecord,
  UpdateConnectionRecord,
} from './connections.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ConnectionsRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  credential_ref: string | null;
  allowed_headers: unknown;
  metadata: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: ConnectionsRow): ConnectionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    type: row.type as ConnectionType,
    baseUrl: row.base_url,
    authType: row.auth_type as ConnectionAuthType,
    credentialRef: row.credential_ref ?? undefined,
    allowedHeaders: (row.allowed_headers ?? []) as string[],
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    status: row.status as ConnectionStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresConnectionsRepository extends ConnectionsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresConnectionsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateConnectionRecord): Promise<ConnectionRecord> {
    const values: Insertable<Connections> = {
      tenant_id: record.tenantId,
      name: record.name,
      base_url: record.baseUrl,
      allowed_headers: JSON.stringify(record.allowedHeaders),
      metadata: JSON.stringify(record.metadata),
    };
    if (record.type !== undefined) {
      values.type = record.type;
    }
    if (record.authType !== undefined) {
      values.auth_type = record.authType;
    }
    if (record.credentialRef !== undefined) {
      values.credential_ref = record.credentialRef;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }

    const row = await this.db
      .insertInto('connections')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ConnectionRecord[]> {
    if (!UUID_RE.test(tenantId)) {
      return [];
    }

    const rows = await this.db
      .selectFrom('connections')
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
      .selectFrom('connections')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', tenantId)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ConnectionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('connections')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateConnectionRecord,
  ): Promise<ConnectionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Connections> = {};
    if (record.name !== undefined) {
      updates.name = record.name;
    }
    if (record.type !== undefined) {
      updates.type = record.type;
    }
    if (record.baseUrl !== undefined) {
      updates.base_url = record.baseUrl;
    }
    if (record.authType !== undefined) {
      updates.auth_type = record.authType;
    }
    if (record.credentialRef !== undefined) {
      updates.credential_ref = record.credentialRef;
    }
    if (record.allowedHeaders !== undefined) {
      updates.allowed_headers = JSON.stringify(record.allowedHeaders);
    }
    if (record.metadata !== undefined) {
      updates.metadata = JSON.stringify(record.metadata);
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }

    const row = await this.db
      .updateTable('connections')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }
}
