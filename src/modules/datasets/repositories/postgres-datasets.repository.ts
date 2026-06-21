import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { Datasets, DB } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  DatasetField,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.constants';
import {
  CreateDatasetRecord,
  DatasetFilters,
  DatasetRecord,
  DatasetsRepository,
  UpdateDatasetRecord,
} from './datasets.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DatasetsRow {
  id: string;
  tenant_id: string;
  connection_id: string | null;
  dataset_key: string;
  name: string;
  description: string | null;
  source_type: string;
  status: string;
  refresh_mode: string;
  schema_mode: string;
  fields: unknown;
  primary_key_fields: unknown;
  time_field: string | null;
  tags: unknown;
  metadata: unknown;
  settings: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: DatasetsRow): DatasetRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    connectionId: row.connection_id ?? undefined,
    datasetKey: row.dataset_key,
    name: row.name,
    description: row.description ?? undefined,
    sourceType: row.source_type as DatasetSourceType,
    status: row.status as DatasetStatus,
    refreshMode: row.refresh_mode as DatasetRefreshMode,
    schemaMode: row.schema_mode as DatasetSchemaMode,
    fields: (row.fields ?? []) as DatasetField[],
    primaryKeyFields: (row.primary_key_fields ?? []) as string[],
    timeField: row.time_field ?? undefined,
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
export class PostgresDatasetsRepository extends DatasetsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresDatasetsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateDatasetRecord): Promise<DatasetRecord> {
    const values: Insertable<Datasets> = {
      tenant_id: record.tenantId,
      dataset_key: record.datasetKey,
      name: record.name,
      fields: JSON.stringify(record.fields),
      primary_key_fields: JSON.stringify(record.primaryKeyFields),
      tags: JSON.stringify(record.tags),
      metadata: JSON.stringify(record.metadata),
      settings: JSON.stringify(record.settings),
    };
    if (record.connectionId !== undefined) {
      values.connection_id = record.connectionId;
    }
    if (record.description !== undefined) {
      values.description = record.description;
    }
    if (record.sourceType !== undefined) {
      values.source_type = record.sourceType;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }
    if (record.refreshMode !== undefined) {
      values.refresh_mode = record.refreshMode;
    }
    if (record.schemaMode !== undefined) {
      values.schema_mode = record.schemaMode;
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
      .insertInto('datasets')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: DatasetFilters,
    page: number,
    pageSize: number,
  ): Promise<DatasetRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('datasets')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }
    if (filters.datasetKey !== undefined) {
      query = query.where('dataset_key', '=', filters.datasetKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.sourceType !== undefined) {
      query = query.where('source_type', '=', filters.sourceType);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: DatasetFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('datasets')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }
    if (filters.datasetKey !== undefined) {
      query = query.where('dataset_key', '=', filters.datasetKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.sourceType !== undefined) {
      query = query.where('source_type', '=', filters.sourceType);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<DatasetRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('datasets')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDatasetRecord,
  ): Promise<DatasetRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<Datasets> = {};
    if (record.connectionId !== undefined) {
      updates.connection_id = record.connectionId;
    }
    if (record.datasetKey !== undefined) {
      updates.dataset_key = record.datasetKey;
    }
    if (record.name !== undefined) {
      updates.name = record.name;
    }
    if (record.description !== undefined) {
      updates.description = record.description;
    }
    if (record.sourceType !== undefined) {
      updates.source_type = record.sourceType;
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }
    if (record.refreshMode !== undefined) {
      updates.refresh_mode = record.refreshMode;
    }
    if (record.schemaMode !== undefined) {
      updates.schema_mode = record.schemaMode;
    }
    if (record.fields !== undefined) {
      updates.fields = JSON.stringify(record.fields);
    }
    if (record.primaryKeyFields !== undefined) {
      updates.primary_key_fields = JSON.stringify(record.primaryKeyFields);
    }
    if (record.timeField !== undefined) {
      updates.time_field = record.timeField;
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
      .updateTable('datasets')
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
  ): Promise<DatasetRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DatasetStatus.Archived,
      updatedBy,
    });
  }
}
