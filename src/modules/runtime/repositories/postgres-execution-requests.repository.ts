import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, ExecutionRequests } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import { AdminRole } from '../../auth/types/admin-role';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import {
  CreateExecutionRequestRecord,
  ExecutionRequestFilters,
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from './execution-requests.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ExecutionRequestsRow {
  id: string;
  tenant_id: string;
  request_key: string;
  kind: string;
  status: string;
  query_definition_id: string | null;
  dashboard_definition_id: string | null;
  report_definition_id: string | null;
  connection_id: string | null;
  dataset_id: string | null;
  requested_by_actor_id: string | null;
  requested_by_role: string | null;
  mode: string;
  reason: string | null;
  message: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: ExecutionRequestsRow): ExecutionRequestRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestKey: row.request_key,
    kind: row.kind as ExecutionRequestKind,
    status: row.status as ExecutionRequestStatus,
    queryDefinitionId: row.query_definition_id ?? undefined,
    dashboardDefinitionId: row.dashboard_definition_id ?? undefined,
    reportDefinitionId: row.report_definition_id ?? undefined,
    connectionId: row.connection_id ?? undefined,
    datasetId: row.dataset_id ?? undefined,
    requestedByActorId: row.requested_by_actor_id ?? undefined,
    requestedByRole: (row.requested_by_role ?? undefined) as AdminRole | undefined,
    mode: row.mode as ExecutionRequestMode,
    reason: row.reason ?? undefined,
    message: row.message ?? undefined,
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresExecutionRequestsRepository extends ExecutionRequestsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresExecutionRequestsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateExecutionRequestRecord): Promise<ExecutionRequestRecord> {
    const values: Insertable<ExecutionRequests> = {
      tenant_id: record.tenantId,
      request_key: record.requestKey,
      kind: record.kind,
      status: record.status,
      mode: record.mode,
      metadata: JSON.stringify(record.metadata),
    };
    if (record.queryDefinitionId !== undefined) {
      values.query_definition_id = record.queryDefinitionId;
    }
    if (record.dashboardDefinitionId !== undefined) {
      values.dashboard_definition_id = record.dashboardDefinitionId;
    }
    if (record.reportDefinitionId !== undefined) {
      values.report_definition_id = record.reportDefinitionId;
    }
    if (record.connectionId !== undefined) {
      values.connection_id = record.connectionId;
    }
    if (record.datasetId !== undefined) {
      values.dataset_id = record.datasetId;
    }
    if (record.requestedByActorId !== undefined) {
      values.requested_by_actor_id = record.requestedByActorId;
    }
    if (record.requestedByRole !== undefined) {
      values.requested_by_role = record.requestedByRole;
    }
    if (record.reason !== undefined) {
      values.reason = record.reason;
    }
    if (record.message !== undefined) {
      values.message = record.message;
    }

    const row = await this.db
      .insertInto('execution_requests')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: ExecutionRequestFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('execution_requests')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.kind !== undefined) {
      query = query.where('kind', '=', filters.kind);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.mode !== undefined) {
      query = query.where('mode', '=', filters.mode);
    }
    if (filters.queryDefinitionId !== undefined) {
      query = query.where('query_definition_id', '=', filters.queryDefinitionId);
    }
    if (filters.dashboardDefinitionId !== undefined) {
      query = query.where('dashboard_definition_id', '=', filters.dashboardDefinitionId);
    }
    if (filters.reportDefinitionId !== undefined) {
      query = query.where('report_definition_id', '=', filters.reportDefinitionId);
    }
    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }
    if (filters.datasetId !== undefined) {
      query = query.where('dataset_id', '=', filters.datasetId);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: ExecutionRequestFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('execution_requests')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.kind !== undefined) {
      query = query.where('kind', '=', filters.kind);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.mode !== undefined) {
      query = query.where('mode', '=', filters.mode);
    }
    if (filters.queryDefinitionId !== undefined) {
      query = query.where('query_definition_id', '=', filters.queryDefinitionId);
    }
    if (filters.dashboardDefinitionId !== undefined) {
      query = query.where('dashboard_definition_id', '=', filters.dashboardDefinitionId);
    }
    if (filters.reportDefinitionId !== undefined) {
      query = query.where('report_definition_id', '=', filters.reportDefinitionId);
    }
    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }
    if (filters.datasetId !== undefined) {
      query = query.where('dataset_id', '=', filters.datasetId);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ExecutionRequestRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('execution_requests')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateStatusByTenantAndId(
    tenantId: string,
    id: string,
    status: ExecutionRequestStatus,
  ): Promise<ExecutionRequestRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .updateTable('execution_requests')
      .set({ status, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }
}
