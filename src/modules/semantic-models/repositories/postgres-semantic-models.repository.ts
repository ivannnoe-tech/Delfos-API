import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, SemanticModels } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModelQuality,
  SemanticModelStatus,
} from '../schemas/semantic-model.schema';
import {
  CreateSemanticModelRecord,
  SemanticModelFilters,
  SemanticModelRecord,
  SemanticModelsRepository,
  UpdateSemanticModelRecord,
} from './semantic-models.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SemanticModelsRow {
  id: string;
  tenant_id: string;
  model_key: string;
  name: string;
  description: string | null;
  status: string;
  dataset_keys: unknown;
  owner: string | null;
  steward: string | null;
  certification_owner: string | null;
  tags: unknown;
  quality: unknown;
  measures: unknown;
  dimensions: unknown;
  glossary_terms: unknown;
  metadata: unknown;
  settings: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: SemanticModelsRow): SemanticModelRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    modelKey: row.model_key,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as SemanticModelStatus,
    datasetKeys: (row.dataset_keys ?? []) as string[],
    owner: row.owner ?? undefined,
    steward: row.steward ?? undefined,
    certificationOwner: row.certification_owner ?? undefined,
    tags: (row.tags ?? []) as string[],
    quality: (row.quality ?? { warnings: [] }) as SemanticModelQuality,
    measures: (row.measures ?? []) as SemanticMeasure[],
    dimensions: (row.dimensions ?? []) as SemanticDimension[],
    glossaryTerms: (row.glossary_terms ?? []) as SemanticGlossaryTerm[],
    metadata: (row.metadata ?? {}) as SanitizedMetadata,
    settings: (row.settings ?? {}) as SanitizedMetadata,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresSemanticModelsRepository extends SemanticModelsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresSemanticModelsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateSemanticModelRecord): Promise<SemanticModelRecord> {
    const values: Insertable<SemanticModels> = {
      tenant_id: record.tenantId,
      model_key: record.modelKey,
      name: record.name,
      dataset_keys: JSON.stringify(record.datasetKeys),
      tags: JSON.stringify(record.tags),
      quality: JSON.stringify(record.quality),
      measures: JSON.stringify(record.measures),
      dimensions: JSON.stringify(record.dimensions),
      glossary_terms: JSON.stringify(record.glossaryTerms),
      metadata: JSON.stringify(record.metadata),
      settings: JSON.stringify(record.settings),
    };
    if (record.description !== undefined) {
      values.description = record.description;
    }
    if (record.status !== undefined) {
      values.status = record.status;
    }
    if (record.owner !== undefined) {
      values.owner = record.owner;
    }
    if (record.steward !== undefined) {
      values.steward = record.steward;
    }
    if (record.certificationOwner !== undefined) {
      values.certification_owner = record.certificationOwner;
    }
    if (record.createdBy !== undefined) {
      values.created_by = record.createdBy;
    }
    if (record.updatedBy !== undefined) {
      values.updated_by = record.updatedBy;
    }

    const row = await this.db
      .insertInto('semantic_models')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: SemanticModelFilters,
    page: number,
    pageSize: number,
  ): Promise<SemanticModelRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('semantic_models')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.modelKey !== undefined) {
      query = query.where('model_key', '=', filters.modelKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: SemanticModelFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('semantic_models')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.modelKey !== undefined) {
      query = query.where('model_key', '=', filters.modelKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<SemanticModelRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('semantic_models')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateSemanticModelRecord,
  ): Promise<SemanticModelRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<SemanticModels> = {};
    if (record.modelKey !== undefined) {
      updates.model_key = record.modelKey;
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
    if (record.datasetKeys !== undefined) {
      updates.dataset_keys = JSON.stringify(record.datasetKeys);
    }
    if (record.owner !== undefined) {
      updates.owner = record.owner;
    }
    if (record.steward !== undefined) {
      updates.steward = record.steward;
    }
    if (record.certificationOwner !== undefined) {
      updates.certification_owner = record.certificationOwner;
    }
    if (record.tags !== undefined) {
      updates.tags = JSON.stringify(record.tags);
    }
    if (record.quality !== undefined) {
      updates.quality = JSON.stringify(record.quality);
    }
    if (record.measures !== undefined) {
      updates.measures = JSON.stringify(record.measures);
    }
    if (record.dimensions !== undefined) {
      updates.dimensions = JSON.stringify(record.dimensions);
    }
    if (record.glossaryTerms !== undefined) {
      updates.glossary_terms = JSON.stringify(record.glossaryTerms);
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
      .updateTable('semantic_models')
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
  ): Promise<SemanticModelRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: SemanticModelStatus.Archived,
      updatedBy,
    });
  }
}
