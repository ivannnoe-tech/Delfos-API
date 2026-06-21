import { Inject, Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { DashboardDefinitions, DB } from '../../../database/postgres/database.types';
import { KYSELY_DB } from '../../../database/postgres/postgres.constants';
import {
  DashboardDefinitionFilter,
  DashboardDefinitionLayout,
  DashboardDefinitionSection,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../schemas/dashboard-definition.schema';
import {
  CreateDashboardDefinitionRecord,
  DashboardDefinitionFilters,
  DashboardDefinitionRecord,
  DashboardDefinitionsRepository,
  DashboardDefinitionWidgetRecord,
  UpdateDashboardDefinitionRecord,
} from './dashboard-definitions.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DashboardDefinitionsRow {
  id: string;
  tenant_id: string;
  dashboard_key: string;
  name: string;
  description: string | null;
  status: string;
  visibility: string;
  layout: unknown;
  sections: unknown;
  widgets: unknown;
  filters: unknown;
  tags: unknown;
  metadata: unknown;
  settings: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: DashboardDefinitionsRow): DashboardDefinitionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    dashboardKey: row.dashboard_key,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as DashboardDefinitionStatus,
    visibility: row.visibility as DashboardDefinitionVisibility,
    layout: (row.layout ?? {}) as DashboardDefinitionLayout,
    sections: (row.sections ?? []) as DashboardDefinitionSection[],
    widgets: (row.widgets ?? []) as DashboardDefinitionWidgetRecord[],
    filters: (row.filters ?? []) as DashboardDefinitionFilter[],
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
export class PostgresDashboardDefinitionsRepository extends DashboardDefinitionsRepository {
  constructor(@Inject(KYSELY_DB) private readonly kysely: Kysely<DB> | null) {
    super();
  }

  private get db(): Kysely<DB> {
    if (!this.kysely) {
      throw new Error(
        'PostgresDashboardDefinitionsRepository used without a configured PostgreSQL connection.',
      );
    }
    return this.kysely;
  }

  async create(record: CreateDashboardDefinitionRecord): Promise<DashboardDefinitionRecord> {
    const values: Insertable<DashboardDefinitions> = {
      tenant_id: record.tenantId,
      dashboard_key: record.dashboardKey,
      name: record.name,
      layout: JSON.stringify(record.layout),
      sections: JSON.stringify(record.sections),
      widgets: JSON.stringify(record.widgets),
      filters: JSON.stringify(record.filters),
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
    if (record.createdBy !== undefined) {
      values.created_by = record.createdBy;
    }
    if (record.updatedBy !== undefined) {
      values.updated_by = record.updatedBy;
    }

    const row = await this.db
      .insertInto('dashboard_definitions')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRecord(row);
  }

  async findByFilters(
    filters: DashboardDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<DashboardDefinitionRecord[]> {
    if (!UUID_RE.test(filters.tenantId)) {
      return [];
    }

    let query = this.db
      .selectFrom('dashboard_definitions')
      .selectAll()
      .where('tenant_id', '=', filters.tenantId);
    if (filters.dashboardKey !== undefined) {
      query = query.where('dashboard_key', '=', filters.dashboardKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.visibility !== undefined) {
      query = query.where('visibility', '=', filters.visibility);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return rows.map((row) => toRecord(row));
  }

  async countByFilters(filters: DashboardDefinitionFilters): Promise<number> {
    if (!UUID_RE.test(filters.tenantId)) {
      return 0;
    }

    let query = this.db
      .selectFrom('dashboard_definitions')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('tenant_id', '=', filters.tenantId);
    if (filters.dashboardKey !== undefined) {
      query = query.where('dashboard_key', '=', filters.dashboardKey);
    }
    if (filters.status !== undefined) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.visibility !== undefined) {
      query = query.where('visibility', '=', filters.visibility);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<DashboardDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const row = await this.db
      .selectFrom('dashboard_definitions')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    return row ? toRecord(row) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDashboardDefinitionRecord,
  ): Promise<DashboardDefinitionRecord | null> {
    if (!UUID_RE.test(tenantId) || !UUID_RE.test(id)) {
      return null;
    }

    const updates: Updateable<DashboardDefinitions> = {};
    if (record.dashboardKey !== undefined) {
      updates.dashboard_key = record.dashboardKey;
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
    if (record.layout !== undefined) {
      updates.layout = JSON.stringify(record.layout);
    }
    if (record.sections !== undefined) {
      updates.sections = JSON.stringify(record.sections);
    }
    if (record.widgets !== undefined) {
      updates.widgets = JSON.stringify(record.widgets);
    }
    if (record.filters !== undefined) {
      updates.filters = JSON.stringify(record.filters);
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
      .updateTable('dashboard_definitions')
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
  ): Promise<DashboardDefinitionRecord | null> {
    return this.updateByTenantAndId(tenantId, id, {
      status: DashboardDefinitionStatus.Archived,
      updatedBy,
    });
  }
}
