import {
  FieldMappingStatus,
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../schemas/field-mapping.schema';

/**
 * Persistence-neutral field-mapping record returned by every
 * {@link FieldMappingsRepository} implementation (Mongo or PostgreSQL). The
 * service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 */
export interface FieldMappingRecord {
  id: string;
  tenantId: string;
  connectionId?: string;
  datasetKey: string;
  sourcePath: string;
  targetField: string;
  targetType: FieldMappingTargetType;
  required: boolean;
  transform?: FieldMappingTransform;
  status: FieldMappingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFieldMappingRecord {
  tenantId: string;
  connectionId?: string;
  datasetKey: string;
  sourcePath: string;
  targetField: string;
  targetType: FieldMappingTargetType;
  required?: boolean;
  transform?: FieldMappingTransform;
  status?: FieldMappingStatus;
}

export type UpdateFieldMappingRecord = Partial<Omit<CreateFieldMappingRecord, 'tenantId'>>;

export interface FieldMappingFilters {
  tenantId: string;
  datasetKey?: string;
  connectionId?: string;
}

/**
 * Repository contract for field mappings. Implemented by
 * `MongoFieldMappingsRepository` and `PostgresFieldMappingsRepository`; the
 * module selects one at runtime based on whether `DELFOS_POSTGRES_URL` is
 * configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class FieldMappingsRepository {
  abstract create(record: CreateFieldMappingRecord): Promise<FieldMappingRecord>;
  abstract findByFilters(
    filters: FieldMappingFilters,
    page: number,
    pageSize: number,
  ): Promise<FieldMappingRecord[]>;
  abstract countByFilters(filters: FieldMappingFilters): Promise<number>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateFieldMappingRecord,
  ): Promise<FieldMappingRecord | null>;
  abstract deactivateByTenantAndId(
    tenantId: string,
    id: string,
  ): Promise<FieldMappingRecord | null>;
}
