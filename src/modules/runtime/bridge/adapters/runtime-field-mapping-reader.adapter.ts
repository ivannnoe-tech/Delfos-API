import {
  RuntimeFieldMappingLike,
  RuntimeFieldMappingReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderBoolean,
  toRuntimeReaderRecord,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeFieldMappingReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly datasetKey?: unknown;
  readonly targetField?: unknown;
  readonly sourceField?: unknown;
  readonly sourcePath?: unknown;
  readonly sourceObject?: unknown;
  readonly sourceFieldPath?: unknown;
  readonly logicalField?: unknown;
  readonly dataType?: unknown;
  readonly targetType?: unknown;
  readonly required?: unknown;
  readonly status?: unknown;
  readonly transform?: unknown;
  readonly connectionId?: unknown;
}

export interface RuntimeFieldMappingReaderAdapterListResult {
  readonly items?: readonly RuntimeFieldMappingReaderAdapterSource[];
}

export interface RuntimeFieldMappingReaderAdapterDependency {
  findByTenantAndDatasetKey?(
    tenantId: string,
    datasetKey: string,
  ): Promise<readonly RuntimeFieldMappingReaderAdapterSource[]>;
  findByFilters?(
    query: Readonly<{
      tenantId: string;
      datasetKey: string;
      page: number;
      pageSize: number;
    }>,
  ): Promise<
    RuntimeFieldMappingReaderAdapterListResult | readonly RuntimeFieldMappingReaderAdapterSource[]
  >;
}

export class RuntimeFieldMappingReaderAdapter implements RuntimeFieldMappingReaderPort {
  constructor(
    private readonly fieldMappings: RuntimeFieldMappingReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndDatasetKey(
    tenantId: string,
    datasetKey: string,
  ): Promise<readonly RuntimeFieldMappingLike[]> {
    try {
      const mappings = await this.loadMappings(tenantId, datasetKey);

      return mappings
        .filter(
          (mapping) =>
            hasRuntimeReaderTenant(mapping, tenantId) && mapping.datasetKey === datasetKey,
        )
        .map((mapping) => this.toMapping(mapping, tenantId))
        .filter((mapping): mapping is RuntimeFieldMappingLike => mapping !== undefined);
    } catch {
      return [];
    }
  }

  private async loadMappings(
    tenantId: string,
    datasetKey: string,
  ): Promise<readonly RuntimeFieldMappingReaderAdapterSource[]> {
    if (this.fieldMappings.findByTenantAndDatasetKey) {
      return this.fieldMappings.findByTenantAndDatasetKey(tenantId, datasetKey);
    }

    if (!this.fieldMappings.findByFilters) {
      return [];
    }

    const result = await this.fieldMappings.findByFilters({
      tenantId,
      datasetKey,
      page: 1,
      pageSize: 1000,
    });

    if (isRuntimeFieldMappingReaderAdapterListResult(result)) {
      return result.items ?? [];
    }

    return result;
  }

  private toMapping(
    source: RuntimeFieldMappingReaderAdapterSource,
    tenantId: string,
  ): RuntimeFieldMappingLike | undefined {
    const id = getRuntimeReaderEntityId(source);
    const datasetKey = toRuntimeReaderString(source.datasetKey);
    const targetField = toRuntimeReaderString(source.targetField);
    const status = toRuntimeReaderString(source.status);

    if (!id || !datasetKey || !targetField || !status) {
      return undefined;
    }

    const sourceField = toRuntimeReaderString(source.sourceField);
    const sourcePath = toRuntimeReaderString(source.sourcePath);
    const sourceFieldPath =
      toRuntimeReaderString(source.sourceFieldPath) ?? sourceField ?? sourcePath;
    const dataType =
      toRuntimeReaderString(source.dataType) ?? toRuntimeReaderString(source.targetType);

    return {
      id,
      tenantId,
      datasetKey,
      targetField,
      sourceField,
      sourcePath,
      sourceObject: toRuntimeReaderString(source.sourceObject),
      sourceFieldPath,
      logicalField: toRuntimeReaderString(source.logicalField) ?? targetField,
      dataType,
      targetType: toRuntimeReaderString(source.targetType),
      required: toRuntimeReaderBoolean(source.required),
      status,
      transform: toRuntimeReaderString(source.transform),
      connectionId: toRuntimeReaderString(source.connectionId),
      safeMetadata: buildRuntimeReaderSafeMetadata(
        this.safeMetadataBuilder,
        source.metadata,
        source.safeMetadata,
        toRuntimeReaderRecord({
          status,
          sourceObject: toRuntimeReaderString(source.sourceObject),
          sourceFieldPath,
          targetField,
          dataType,
        }),
      ),
    };
  }
}

function isRuntimeFieldMappingReaderAdapterListResult(
  value:
    | RuntimeFieldMappingReaderAdapterListResult
    | readonly RuntimeFieldMappingReaderAdapterSource[],
): value is RuntimeFieldMappingReaderAdapterListResult {
  return !Array.isArray(value);
}
