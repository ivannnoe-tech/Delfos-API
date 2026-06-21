import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModelQuality,
  SemanticModelStatus,
} from '../schemas/semantic-model.schema';

/**
 * Persistence-neutral semantic model record returned by every
 * {@link SemanticModelsRepository} implementation (Mongo or PostgreSQL). The
 * service maps this to the response DTO, so the REST contract is identical
 * regardless of the backend (ADR-0035 / ADR-0036).
 *
 * Embedded subdocuments (`quality`, `measures`, `dimensions`, `glossaryTerms`)
 * stay as plain objects/arrays — they are JSONB columns under PostgreSQL per the
 * ADR-0036 P2 decision.
 */
export interface SemanticModelRecord {
  id: string;
  tenantId: string;
  modelKey: string;
  name: string;
  description?: string;
  status: SemanticModelStatus;
  datasetKeys: string[];
  owner?: string;
  steward?: string;
  certificationOwner?: string;
  tags: string[];
  quality: SemanticModelQuality;
  measures: SemanticMeasure[];
  dimensions: SemanticDimension[];
  glossaryTerms: SemanticGlossaryTerm[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSemanticModelRecord {
  tenantId: string;
  modelKey: string;
  name: string;
  description?: string;
  status?: SemanticModelStatus;
  datasetKeys: string[];
  owner?: string;
  steward?: string;
  certificationOwner?: string;
  tags: string[];
  quality: SemanticModelQuality;
  measures: SemanticMeasure[];
  dimensions: SemanticDimension[];
  glossaryTerms: SemanticGlossaryTerm[];
  metadata: SanitizedMetadata;
  settings: SanitizedMetadata;
  createdBy?: string;
  updatedBy?: string;
}

export type UpdateSemanticModelRecord = Partial<
  Omit<CreateSemanticModelRecord, 'tenantId' | 'createdBy'>
>;

export interface SemanticModelFilters {
  tenantId: string;
  modelKey?: string;
  status?: SemanticModelStatus;
}

/**
 * Repository contract for semantic models. Implemented by
 * `MongoSemanticModelsRepository` and `PostgresSemanticModelsRepository`; the
 * module selects one at runtime based on whether `DELFOS_POSTGRES_URL` is
 * configured. Used as the DI token.
 *
 * Every query is tenant-scoped: `tenantId` is a mandatory isolation boundary,
 * never an optional filter.
 */
export abstract class SemanticModelsRepository {
  abstract create(record: CreateSemanticModelRecord): Promise<SemanticModelRecord>;
  abstract findByFilters(
    filters: SemanticModelFilters,
    page: number,
    pageSize: number,
  ): Promise<SemanticModelRecord[]>;
  abstract countByFilters(filters: SemanticModelFilters): Promise<number>;
  abstract findByTenantAndId(tenantId: string, id: string): Promise<SemanticModelRecord | null>;
  abstract updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateSemanticModelRecord,
  ): Promise<SemanticModelRecord | null>;
  abstract archiveByTenantAndId(
    tenantId: string,
    id: string,
    updatedBy?: string,
  ): Promise<SemanticModelRecord | null>;
}
