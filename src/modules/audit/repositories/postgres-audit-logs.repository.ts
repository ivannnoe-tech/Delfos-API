import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditLogs, DB } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { AuditLogRecord, AuditLogsRepository, CreateAuditLogRecord } from './audit-logs.repository';

interface AuditLogsRow {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: unknown;
  created_at: Date;
}

function toRecord(row: AuditLogsRow): AuditLogRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    actorUserId: row.actor_user_id ?? undefined,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id ?? undefined,
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    timestamp: row.created_at,
  };
}

@Injectable()
export class PostgresAuditLogsRepository extends AuditLogsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresAuditLogsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateAuditLogRecord): Promise<AuditLogRecord> {
    const values: Insertable<AuditLogs> = {
      tenant_id: record.tenantId,
      action: record.action,
      entity: record.entity,
      metadata: JSON.stringify(record.metadata),
    };
    if (record.actorUserId !== undefined) {
      values.actor_user_id = record.actorUserId;
    }
    if (record.entityId !== undefined) {
      values.entity_id = record.entityId;
    }

    const row = await this.db
      .insertInto('audit_logs')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }
}
