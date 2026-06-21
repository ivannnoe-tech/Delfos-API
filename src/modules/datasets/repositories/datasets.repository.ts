import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  DatasetField,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.schema';

/**
 * Persistence-neutral dataset record returned by every
 * {@link DatasetsRepository} implementation (Mongo or PostgreSQL). The service
 * maps this to the response DTO, so the REST contract is identical regardless of
 * the backend (ADR-0035 / ADR-0036).
 */
export interface DatasetRecord {
  id: string;
  tenantId: string;
  connectionId?: string;
  datasetKey: string;
  name: string;
  description?: string;
  sourceType: DatasetSourceType;
  status: DatasetStatus;
  refreshMode: DatasetRefreshMode;
  schemaMode: DatasetSchemaMode;
  fields: DatasetField[];
  primaryKeyFields: string[];
  timeField?: string;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDatasetRecord {
  tenantId: string;
  connectionId?: string;
  datasetKey: string;
  name: string;
  description?: string;
  sourceType?: DatasetSourceType;
  status?: DatasetStatus;
  refreshMode?: DatasetRefreshMode;
  schemaMode?: DatasetSchemaMode;
  fields: DatasetField[];
  primaryKeyFields: string[];
  timeField?: string;
  tags: string[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateDatasetRecord = Partial<Omit<CreateDatasetRecord, 'tenantId' | 'createdBy'>>;

export interface DatasetFilters {
  tenantId: string;
  connectionId?: string;
  datasetKey?: string;
  status?: DatasetStatus;
  sourceType?: DatasetSourceType;
}

/**
 * Repository contract for datasets. Implemented by `MongoDatasetsRepository` and
 * `PostgresDatasetsRepository`; the module selects one at runtime based on
 * whether `DELFOS_POSTGRES_URL` is configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class DatasetsRepository {
  abstract create(record: CreateDatasetRecord): Promise<DatasetRecord>;
  abstract findByFilters(
    filters: DatasetFilters,
    page: number,
    pageSize: number,
  ): Promise<DatasetRecord[]>;
  abstract countByFilters(filters: DatasetFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<DatasetRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateDatasetRecord,
  ): Promise<DatasetRecord | null>;
  abstract archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<DatasetRecord | null>;
}
