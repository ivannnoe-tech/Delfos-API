import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  ReportDefinitionBlockType,
  ReportDefinitionFilter,
  ReportDefinitionLayout,
  ReportDefinitionParameter,
  ReportDefinitionSection,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.schema';

/**
 * Persistence-neutral block shape used inside a {@link ReportDefinitionRecord}.
 * It mirrors the Mongoose `ReportDefinitionBlock` but exposes `queryDefinitionId`
 * and `dashboardDefinitionId` as opaque string ids (not Mongo `ObjectId`s), so
 * the record is identical regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface ReportDefinitionBlockRecord {
  key: string;
  title: string;
  description?: string;
  type: ReportDefinitionBlockType;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  sectionKey?: string;
  order: number;
  options: SanitizedMetadata;
}

/**
 * Persistence-neutral report definition record returned by every
 * {@link ReportDefinitionsRepository} implementation (Mongo or PostgreSQL).
 * The service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface ReportDefinitionRecord {
  id: string;
  tenantId: string;
  reportKey: string;
  name: string;
  description?: string;
  status: ReportDefinitionStatus;
  visibility: ReportDefinitionVisibility;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  layout: ReportDefinitionLayout;
  sections: ReportDefinitionSection[];
  blocks: ReportDefinitionBlockRecord[];
  filters: ReportDefinitionFilter[];
  parameters: ReportDefinitionParameter[];
  exportOptions: SanitizedMetadata;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportDefinitionRecord {
  tenantId: string;
  reportKey: string;
  name: string;
  description?: string;
  status?: ReportDefinitionStatus;
  visibility?: ReportDefinitionVisibility;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  layout: ReportDefinitionLayout;
  sections: ReportDefinitionSection[];
  blocks: ReportDefinitionBlockRecord[];
  filters: ReportDefinitionFilter[];
  parameters: ReportDefinitionParameter[];
  exportOptions: SanitizedMetadata;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateReportDefinitionRecord = Partial<
  Omit<CreateReportDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface ReportDefinitionFilters {
  tenantId: string;
  reportKey?: string;
  status?: ReportDefinitionStatus;
  visibility?: ReportDefinitionVisibility;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
}

/**
 * Repository contract for report definitions. Implemented by
 * `MongoReportDefinitionsRepository` and `PostgresReportDefinitionsRepository`;
 * the module selects one at runtime based on whether `DELFOS_POSTGRES_URL` is
 * configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class ReportDefinitionsRepository {
  abstract create(record: CreateReportDefinitionRecord): Promise<ReportDefinitionRecord>;
  abstract findByFilters(
    filters: ReportDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<ReportDefinitionRecord[]>;
  abstract countByFilters(filters: ReportDefinitionFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<ReportDefinitionRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateReportDefinitionRecord,
  ): Promise<ReportDefinitionRecord | null>;
  abstract archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<ReportDefinitionRecord | null>;
}
