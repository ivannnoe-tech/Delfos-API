import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  QueryDefinitionDimension,
  QueryDefinitionFilter,
  QueryDefinitionMetric,
  QueryDefinitionSort,
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.constants';

/**
 * Persistence-neutral query definition record returned by every
 * {@link QueryDefinitionsRepository} implementation (Mongo or PostgreSQL). The
 * service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface QueryDefinitionRecord {
  id: string;
  tenantId: string;
  datasetId: string;
  queryKey: string;
  name: string;
  description?: string;
  status: QueryDefinitionStatus;
  type: QueryDefinitionType;
  metrics: QueryDefinitionMetric[];
  dimensions: QueryDefinitionDimension[];
  filters: QueryDefinitionFilter[];
  sorts: QueryDefinitionSort[];
  defaultLimit?: number;
  timeField?: string;
  allowedGranularities: QueryDefinitionTimeGranularity[];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQueryDefinitionRecord {
  tenantId: string;
  datasetId: string;
  queryKey: string;
  name: string;
  description?: string;
  status?: QueryDefinitionStatus;
  type?: QueryDefinitionType;
  metrics: QueryDefinitionMetric[];
  dimensions: QueryDefinitionDimension[];
  filters: QueryDefinitionFilter[];
  sorts: QueryDefinitionSort[];
  defaultLimit?: number;
  timeField?: string;
  allowedGranularities: QueryDefinitionTimeGranularity[];
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateQueryDefinitionRecord = Partial<
  Omit<CreateQueryDefinitionRecord, 'tenantId' | 'createdBy'>
>;

export interface QueryDefinitionFilters {
  tenantId: string;
  datasetId?: string;
  queryKey?: string;
  status?: QueryDefinitionStatus;
  type?: QueryDefinitionType;
}

/**
 * Repository contract for query definitions. Implemented by
 * `MongoQueryDefinitionsRepository` and `PostgresQueryDefinitionsRepository`;
 * the module selects one at runtime based on whether `DELFOS_POSTGRES_URL` is
 * configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class QueryDefinitionsRepository {
  abstract create(record: CreateQueryDefinitionRecord): Promise<QueryDefinitionRecord>;
  abstract findByFilters(
    filters: QueryDefinitionFilters,
    page: number,
    pageSize: number,
  ): Promise<QueryDefinitionRecord[]>;
  abstract countByFilters(filters: QueryDefinitionFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<QueryDefinitionRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateQueryDefinitionRecord,
  ): Promise<QueryDefinitionRecord | null>;
  abstract archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<QueryDefinitionRecord | null>;
}
