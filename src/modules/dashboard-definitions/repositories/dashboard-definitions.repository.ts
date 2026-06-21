import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  DashboardDefinitionFilter,
  DashboardDefinitionLayout,
  DashboardDefinitionSection,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionVisualization,
  DashboardDefinitionWidgetPosition,
  DashboardDefinitionWidgetSize,
  DashboardDefinitionWidgetType,
} from '../schemas/dashboard-definition.constants';

/**
 * Persistence-neutral widget shape used inside a {@link DashboardDefinitionRecord}.
 * It mirrors the Mongoose `DashboardDefinitionWidget` but exposes
 * `queryDefinitionId` as an opaque string id (not a Mongo `ObjectId`), so the
 * record is identical regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface DashboardDefinitionWidgetRecord {
  key: string;
  title: string;
  description?: string;
  type: DashboardDefinitionWidgetType;
  queryDefinitionId?: string;
  sectionKey?: string;
  order: number;
  size?: DashboardDefinitionWidgetSize;
  position?: DashboardDefinitionWidgetPosition;
  visualization?: DashboardDefinitionVisualization;
  options: SanitizedMetadata;
}

/**
 * Persistence-neutral dashboard definition record returned by every
 * {@link DashboardDefinitionsRepository} implementation (Mongo or PostgreSQL).
 * The service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface DashboardDefinitionRecord {
  id: string;
  tenantId: string;
  dashboardKey: string;
  name: string;
  description?: string;
  status: DashboardDefinitionStatus;
  visibility: DashboardDefinitionVisibility;
  layout: DashboardDefinitionLayout;
  sections: DashboardDefinitionSection[];
  widgets: DashboardDefinitionWidgetRecord[];
  filters: DashboardDefinitionFilter[];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDashboardDefinitionRecord {
  tenantId: string;
  dashboardKey: string;
  name: string;
  description?: string;
  status?: DashboardDefinitionStatus;
  visibility?: DashboardDefinitionVisibility;
  layout: DashboardDefinitionLayout;
  sections: DashboardDefinitionSection[];
  widgets: DashboardDefinitionWidgetRecord[];
  filters: DashboardDefinitionFilter[];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateDashboardDefinitionRecord = Partial<
  Omit<CreateDashboardDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface DashboardDefinitionFilters {
  tenantId: string;
  dashboardKey?: string;
  status?: DashboardDefinitionStatus;
  visibility?: DashboardDefinitionVisibility;
}

/**
 * Repository contract for dashboard definitions. Implemented by
 * `MongoDashboardDefinitionsRepository` and
 * `PostgresDashboardDefinitionsRepository`; the module selects one at runtime
 * based on whether `DELFOS_POSTGRES_URL` is configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class DashboardDefinitionsRepository {
  abstract create(record: CreateDashboardDefinitionRecord): Promise<DashboardDefinitionRecord>;
  abstract findByFilters(
    filters: DashboardDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<DashboardDefinitionRecord[]>;
  abstract countByFilters(filters: DashboardDefinitionFilters): Promise<number>;
  abstract findByTenantAndId(
    tenantId: string,
    id: string,
  ): Promise<DashboardDefinitionRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDashboardDefinitionRecord,
  ): Promise<DashboardDefinitionRecord | null>;
  abstract archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<DashboardDefinitionRecord | null>;
}
