import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, QueryDefinitions } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  QueryDefinitionDimension,
  QueryDefinitionFilter,
  QueryDefinitionMetric,
  QueryDefinitionSort,
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.constants';
import {
  CreateQueryDefinitionRecord,
  QueryDefinitionFilters,
  QueryDefinitionRecord,
  QueryDefinitionsRepository,
  UpdateQueryDefinitionRecord,
} from './query-definitions.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface QueryDefinitionsRow {
  id: string;
  tenant_id: string;
  dataset_id: string;
  query_key: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  metrics: unknown;
  dimensions: unknown;
  filters: unknown;
  sorts: unknown;
  default_limit: number | null;
  time_field: string | null;
  allowed_granularities: unknown;
  tags: unknown;
  metadata: unknown;
  settings: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: QueryDefinitionsRow): QueryDefinitionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    datasetId: row.dataset_id,
    queryKey: row.query_key,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as QueryDefinitionStatus,
    type: row.type as QueryDefinitionType,
    metrics: (row.metrics ?? []) as QueryDefinitionMetric[],
    dimensions: (row.dimensions ?? []) as QueryDefinitionDimension[],
    filters: (row.filters ?? []) as QueryDefinitionFilter[],
    sorts: (row.sorts ?? []) as QueryDefinitionSort[],
    defaultLimit: row.default_limit ?? undefined,
    timeField: row.time_field ?? undefined,
    allowedGranularities: (row.allowed_granularities ?? []) as QueryDefinitionTimeGranularity[],
    tags: (row.tags ?? []) as string[],
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    settings: (row.settings ?? {}) as SanitizedMetadata,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresQueryDefinitionsRepository extends QueryDefinitionsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresQueryDefinitionsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateQueryDefinitionRecord): Promise<QueryDefinitionRecord> {
    const values: Insertable<QueryDefinitions> = {
      tenant_id: record.tenantId,
      dataset_id: record.datasetId,
      query_key: record.queryKey,
      name: record.name,
      metrics: JSON.stringify(record.metrics),
      dimensions: JSON.stringify(record.dimensions),
      filters: JSON.stringify(record.filters),
      sorts: JSON.stringify(record.sorts),
      allowed_granularities: JSON.stringify(record.allowedGranularities),
      tags: JSON.stringify(record.tags),
      metadata: JSON.stringify(record.metadata),
      settings: JSON.stringify(record.settings),
    };
    if (record.description !== undefined) {
      values.description = record.description;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }
    if (record.type !== undefined) {
      values.type = record.type;
    }
    if (record.defaultLimit !== undefined) {
      values.default_limit = record.defaultLimit;
    }
    if (record.timeField !== undefined) {
      values.time_field = record.timeField;
    }
    if (record.createdBy !== undefined) {
      values.created_by = record.createdBy;
    }
    if (record.updatedBy !== undefined) {
      values.updated_by = record.updatedBy;
    }

    const row = await this.db
      .insertInto('query_definitions')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: QueryDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<QueryDefinitionRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('query_definitions')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.datasetId !== undefined) {
      query = query.where('dataset_id', '=', filters.datasetId);
    }
    if (filters.queryKey !== undefined) {
      query = query.where('query_key', '=', filters.queryKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.type !== undefined) {
      query = query.where('type', '=', filters.type);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: QueryDefinitionFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('query_definitions')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.datasetId !== undefined) {
      query = query.where('dataset_id', '=', filters.datasetId);
    }
    if (filters.queryKey !== undefined) {
      query = query.where('query_key', '=', filters.queryKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.type !== undefined) {
      query = query.where('type', '=', filters.type);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<QueryDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('query_definitions')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateQueryDefinitionRecord,
  ): Promise<QueryDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<QueryDefinitions> = {};
    if (record.datasetId !== undefined) {
      updates.dataset_id = record.datasetId;
    }
    if (record.queryKey !== undefined) {
      updates.query_key = record.queryKey;
    }
    if (record.name !== undefined) {
      updates.name = record.name;
    }
    if (record.description !== undefined) {
      updates.description = record.description;
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }
    if (record.type !== undefined) {
      updates.type = record.type;
    }
    if (record.metrics !== undefined) {
      updates.metrics = JSON.stringify(record.metrics);
    }
    if (record.dimensions !== undefined) {
      updates.dimensions = JSON.stringify(record.dimensions);
    }
    if (record.filters !== undefined) {
      updates.filters = JSON.stringify(record.filters);
    }
    if (record.sorts !== undefined) {
      updates.sorts = JSON.stringify(record.sorts);
    }
    if (record.defaultLimit !== undefined) {
      updates.default_limit = record.defaultLimit;
    }
    if (record.timeField !== undefined) {
      updates.time_field = record.timeField;
    }
    if (record.allowedGranularities !== undefined) {
      updates.allowed_granularities = JSON.stringify(record.allowedGranularities);
    }
    if (record.tags !== undefined) {
      updates.tags = JSON.stringify(record.tags);
    }
    if (record.metadata !== undefined) {
      updates.metadata = JSON.stringify(record.metadata);
    }
    if (record.settings !== undefined) {
      updates.settings = JSON.stringify(record.settings);
    }
    if (record.updatedBy !== undefined) {
      updates.updated_by = record.updatedBy;
    }

    const row = await this.db
      .updateTable('query_definitions')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<QueryDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: QueryDefinitionStatus.Archived,
      updatedBy,
    });
  }
}
