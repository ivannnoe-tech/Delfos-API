import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, ExecutionRequestEvents } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';
import {
  CreateExecutionRequestEventRecord,
  ExecutionRequestEventFilters,
  ExecutionRequestEventRecord,
  ExecutionRequestEventsRepository,
} from './execution-request-events.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ExecutionRequestEventsRow {
  id: string;
  tenant_id: string;
  execution_request_id: string;
  request_key: string;
  event_type: string;
  previous_status: string | null;
  next_status: string | null;
  message: string | null;
  reason: string | null;
  actor_id: string | null;
  actor_role: string | null;
  metadata: unknown;
  created_at: Date;
}

function toRecord(row: ExecutionRequestEventsRow): ExecutionRequestEventRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    executionRequestId: row.execution_request_id,
    requestKey: row.request_key,
    eventType: row.event_type as ExecutionRequestEventType,
    previousStatus: (row.previous_status ?? undefined) as ExecutionRequestStatus | undefined,
    nextStatus: (row.next_status ?? undefined) as ExecutionRequestStatus | undefined,
    message: row.message ?? undefined,
    reason: row.reason ?? undefined,
    actorId: row.actor_id ?? undefined,
    actorRole: (row.actor_role ?? undefined) as AdminRole | undefined,
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    createdAt: row.created_at,
  };
}

@Injectable()
export class PostgresExecutionRequestEventsRepository extends ExecutionRequestEventsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresExecutionRequestEventsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateExecutionRequestEventRecord): Promise<ExecutionRequestEventRecord> {
    const values: Insertable<ExecutionRequestEvents> = {
      tenant_id: record.tenantId,
      execution_request_id: record.executionRequestId,
      request_key: record.requestKey,
      event_type: record.eventType,
      metadata: JSON.stringify(record.metadata),
    };
    if (record.previousStatus !== undefined) {
      values.previous_status = record.previousStatus;
    }
    if (record.nextStatus !== undefined) {
      values.next_status = record.nextStatus;
    }
    if (record.message !== undefined) {
      values.message = record.message;
    }
    if (record.reason !== undefined) {
      values.reason = record.reason;
    }
    if (record.actorId !== undefined) {
      values.actor_id = record.actorId;
    }
    if (record.actorRole !== undefined) {
      values.actor_role = record.actorRole;
    }

    const row = await this.db
      .insertInto('execution_request_events')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: ExecutionRequestEventFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestEventRecord[]> {
    if (!UUID_RE.test(filters.tenantId) || !UUID_RE.test(filters.executionRequestId)) {
      return [];
    }

    let query = this.db
      .selectFrom('execution_request_events')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId)
      .where('execution_request_id', '=', filters.executionRequestId);
    if (filters.eventType !== undefined) {
      query = query.where('event_type', '=', filters.eventType);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: ExecutionRequestEventFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId) || !UUID_RE.test(filters.executionRequestId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('execution_request_events')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId)
      .where('execution_request_id', '=', filters.executionRequestId);
    if (filters.eventType !== undefined) {
      query = query.where('event_type', '=', filters.eventType);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }
}
