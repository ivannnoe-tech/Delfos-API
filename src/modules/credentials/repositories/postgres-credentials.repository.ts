import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { Credentials, DB } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { CredentialStatus, CredentialType } from '../schemas/credential.constants';
import {
  CreateCredentialRecord,
  CredentialFilters,
  CredentialRecord,
  CredentialsRepository,
  RevokeCredentialRecord,
  RotateCredentialRecord,
} from './credentials.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CredentialsRow {
  id: string;
  tenant_id: string;
  connection_id: string | null;
  type: string;
  provider: string | null;
  name: string;
  status: string;
  masked_preview: string | null;
  rotated_at: Date | null;
  revoked_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Maps a row to the neutral record. `protected_secret_value` is intentionally
 * never read into the record so reads cannot leak the secret, mirroring the
 * Mongoose `select: false` behaviour.
 */
function toRecord(row: CredentialsRow): CredentialRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    connectionId: row.connection_id ?? undefined,
    type: row.type as CredentialType,
    provider: row.provider ?? undefined,
    name: row.name,
    status: row.status as CredentialStatus,
    maskedPreview: row.masked_preview,
    rotatedAt: row.rotated_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresCredentialsRepository extends CredentialsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresCredentialsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateCredentialRecord): Promise<CredentialRecord> {
    const values: Insertable<Credentials> = {
      tenant_id: record.tenantId,
      type: record.type,
      name: record.name,
      masked_preview: record.maskedPreview,
      protected_secret_value: record.protectedSecretValue,
      protection_provider: record.protectionProvider,
    };
    if (record.connectionId !== undefined) {
      values.connection_id = record.connectionId;
    }
    if (record.provider !== undefined) {
      values.provider = record.provider;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }
    if (record.createdBy !== undefined) {
      values.created_by = record.createdBy;
    }
    if (record.updatedBy !== undefined) {
      values.updated_by = record.updatedBy;
    }

    const row = await this.db
      .insertInto('credentials')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: CredentialFilters,
    page: number,
    pageSize: number,
  ): Promise<CredentialRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }
    if (filters.connectionId !== undefined && !UUID_RE.test(filters.connectionId)) {
      return [];
    }

    let query = this.db
      .selectFrom('credentials')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);

    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: CredentialFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }
    if (filters.connectionId !== undefined && !UUID_RE.test(filters.connectionId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('credentials')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);

    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<CredentialRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('credentials')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async rotateByTenantAndId(
    tenantId: string,
    id: string,
    record: RotateCredentialRecord,
  ): Promise<CredentialRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Credentials> = {
      masked_preview: record.maskedPreview,
      protected_secret_value: record.protectedSecretValue,
      protection_provider: record.protectionProvider,
      rotated_at: record.rotatedAt,
      status: record.status,
    };
    if (record.updatedBy !== undefined) {
      updates.updated_by = record.updatedBy;
    }

    const row = await this.db
      .updateTable('credentials')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async revokeByTenantAndId(
    tenantId: string,
    id: string,
    record: RevokeCredentialRecord,
  ): Promise<CredentialRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Credentials> = {
      status: record.status,
      revoked_at: record.revokedAt,
    };
    if (record.updatedBy !== undefined) {
      updates.updated_by = record.updatedBy;
    }

    const row = await this.db
      .updateTable('credentials')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }
}
