import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DB, ReportDefinitions } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  ReportDefinitionFilter,
  ReportDefinitionLayout,
  ReportDefinitionParameter,
  ReportDefinitionSection,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.constants';
import {
  CreateReportDefinitionRecord,
  ReportDefinitionBlockRecord,
  ReportDefinitionFilters,
  ReportDefinitionRecord,
  ReportDefinitionsRepository,
  UpdateReportDefinitionRecord,
} from './report-definitions.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReportDefinitionsRow {
  id: string;
  tenant_id: string;
  report_key: string;
  name: string;
  description: string | null;
  status: string;
  visibility: string;
  query_definition_id: string | null;
  dashboard_definition_id: string | null;
  layout: unknown;
  sections: unknown;
  blocks: unknown;
  filters: unknown;
  parameters: unknown;
  export_options: unknown;
  tags: unknown;
  metadata: unknown;
  settings: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: ReportDefinitionsRow): ReportDefinitionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    reportKey: row.report_key,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as ReportDefinitionStatus,
    visibility: row.visibility as ReportDefinitionVisibility,
    queryDefinitionId: row.query_definition_id ?? undefined,
    dashboardDefinitionId: row.dashboard_definition_id ?? undefined,
    layout: (row.layout ?? {}) as ReportDefinitionLayout,
    sections: (row.sections ?? []) as ReportDefinitionSection[],
    blocks: (row.blocks ?? []) as ReportDefinitionBlockRecord[],
    filters: (row.filters ?? []) as ReportDefinitionFilter[],
    parameters: (row.parameters ?? []) as ReportDefinitionParameter[],
    exportOptions: (row.export_options ?? {}) as SanitizedMetadata,
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
export class PostgresReportDefinitionsRepository extends ReportDefinitionsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresReportDefinitionsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateReportDefinitionRecord): Promise<ReportDefinitionRecord> {
    const values: Insertable<ReportDefinitions> = {
      tenant_id: record.tenantId,
      report_key: record.reportKey,
      name: record.name,
      layout: JSON.stringify(record.layout),
      sections: JSON.stringify(record.sections),
      blocks: JSON.stringify(record.blocks),
      filters: JSON.stringify(record.filters),
      parameters: JSON.stringify(record.parameters),
      export_options: JSON.stringify(record.exportOptions),
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
    if (record.visibility !== undefined) {
      values.visibility = record.visibility;
    }
    if (record.queryDefinitionId !== undefined) {
      values.query_definition_id = record.queryDefinitionId;
    }
    if (record.dashboardDefinitionId !== undefined) {
      values.dashboard_definition_id = record.dashboardDefinitionId;
    }
    if (record.createdBy !== undefined) {
      values.created_by = record.createdBy;
    }
    if (record.updatedBy !== undefined) {
      values.updated_by = record.updatedBy;
    }

    const row = await this.db
      .insertInto('report_definitions')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: ReportDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<ReportDefinitionRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('report_definitions')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.reportKey !== undefined) {
      query = query.where('report_key', '=', filters.reportKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.visibility !== undefined) {
      query = query.where('visibility', '=', filters.visibility);
    }
    if (filters.queryDefinitionId !== undefined) {
      query = query.where('query_definition_id', '=', filters.queryDefinitionId);
    }
    if (filters.dashboardDefinitionId !== undefined) {
      query = query.where('dashboard_definition_id', '=', filters.dashboardDefinitionId);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: ReportDefinitionFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('report_definitions')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.reportKey !== undefined) {
      query = query.where('report_key', '=', filters.reportKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.visibility !== undefined) {
      query = query.where('visibility', '=', filters.visibility);
    }
    if (filters.queryDefinitionId !== undefined) {
      query = query.where('query_definition_id', '=', filters.queryDefinitionId);
    }
    if (filters.dashboardDefinitionId !== undefined) {
      query = query.where('dashboard_definition_id', '=', filters.dashboardDefinitionId);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ReportDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('report_definitions')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateReportDefinitionRecord,
  ): Promise<ReportDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<ReportDefinitions> = {};
    if (record.reportKey !== undefined) {
      updates.report_key = record.reportKey;
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
    if (record.visibility !== undefined) {
      updates.visibility = record.visibility;
    }
    if (record.queryDefinitionId !== undefined) {
      updates.query_definition_id = record.queryDefinitionId;
    }
    if (record.dashboardDefinitionId !== undefined) {
      updates.dashboard_definition_id = record.dashboardDefinitionId;
    }
    if (record.layout !== undefined) {
      updates.layout = JSON.stringify(record.layout);
    }
    if (record.sections !== undefined) {
      updates.sections = JSON.stringify(record.sections);
    }
    if (record.blocks !== undefined) {
      updates.blocks = JSON.stringify(record.blocks);
    }
    if (record.filters !== undefined) {
      updates.filters = JSON.stringify(record.filters);
    }
    if (record.parameters !== undefined) {
      updates.parameters = JSON.stringify(record.parameters);
    }
    if (record.exportOptions !== undefined) {
      updates.export_options = JSON.stringify(record.exportOptions);
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
      .updateTable('report_definitions')
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
  ): Promise<ReportDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: ReportDefinitionStatus.Archived,
      updatedBy,
    });
  }
}
