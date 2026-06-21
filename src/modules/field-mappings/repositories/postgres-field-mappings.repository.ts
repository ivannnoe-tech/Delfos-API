import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { DB, FieldMappings } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.schema';
import {
  CreateFieldMappingRecord,
  FieldMappingFilters,
  FieldMappingRecord,
  FieldMappingsRepository,
  UpdateFieldMappingRecord,
} from './field-mappings.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FieldMappingsRow {
  id: string;
  tenant_id: string;
  connection_id: string | null;
  dataset_key: string;
  source_path: string;
  target_field: string;
  target_type: string;
  required: boolean;
  transform: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: FieldMappingsRow): FieldMappingRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    connectionId: row.connection_id ?? undefined,
    datasetKey: row.dataset_key,
    sourcePath: row.source_path,
    targetField: row.target_field,
    targetType: row.target_type as FieldMappingTargetType,
    required: row.required,
    transform: (row.transform ?? undefined) as FieldMappingTransform | undefined,
    status: row.status as FieldMappingStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresFieldMappingsRepository extends FieldMappingsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresFieldMappingsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateFieldMappingRecord): Promise<FieldMappingRecord> {
    const values: Insertable<FieldMappings> = {
      tenant_id: record.tenantId,
      dataset_key: record.datasetKey,
      source_path: record.sourcePath,
      target_field: record.targetField,
      target_type: record.targetType,
    };
    if (record.connectionId !== undefined) {
      values.connection_id = record.connectionId;
    }
    if (record.required !== undefined) {
      values.required = record.required;
    }
    if (record.transform !== undefined) {
      values.transform = record.transform;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }

    const row = await this.db
      .insertInto('field_mappings')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: FieldMappingFilters,
    page: number,
    pageSize: number,
  ): Promise<FieldMappingRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('field_mappings')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.datasetKey !== undefined) {
      query = query.where('dataset_key', '=', filters.datasetKey);
    }
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

  async countByFilters(filters: FieldMappingFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('field_mappings')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.datasetKey !== undefined) {
      query = query.where('dataset_key', '=', filters.datasetKey);
    }
    if (filters.connectionId !== undefined) {
      query = query.where('connection_id', '=', filters.connectionId);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateFieldMappingRecord,
  ): Promise<FieldMappingRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<FieldMappings> = {};
    if (record.connectionId !== undefined) {
      updates.connection_id = record.connectionId;
    }
    if (record.datasetKey !== undefined) {
      updates.dataset_key = record.datasetKey;
    }
    if (record.sourcePath !== undefined) {
      updates.source_path = record.sourcePath;
    }
    if (record.targetField !== undefined) {
      updates.target_field = record.targetField;
    }
    if (record.targetType !== undefined) {
      updates.target_type = record.targetType;
    }
    if (record.required !== undefined) {
      updates.required = record.required;
    }
    if (record.transform !== undefined) {
      updates.transform = record.transform;
    }
    if (record.status !== undefined) {
      updates.status = record.status;
    }

    const row = await this.db
      .updateTable('field_mappings')
      .set({ ...updates, updated_at: sql`now()` })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  deactivateByTenantAndId(tenantId: string, id: string): Promise<FieldMappingRecord | null> {
    return this.updateByTenantAndId(tenantId, id, { status: FieldMappingStatus.Inactive });
  }
}
