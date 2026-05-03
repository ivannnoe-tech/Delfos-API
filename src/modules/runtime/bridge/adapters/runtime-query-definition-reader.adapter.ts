import {
  RuntimeQueryDefinitionLike,
  RuntimeQueryDefinitionReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeQueryDefinitionReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly datasetId?: unknown;
  readonly queryKey?: unknown;
  readonly status?: unknown;
  readonly type?: unknown;
}

export interface RuntimeQueryDefinitionReaderAdapterDependency {
  findOne(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<RuntimeQueryDefinitionReaderAdapterSource | null>;
}

export class RuntimeQueryDefinitionReaderAdapter implements RuntimeQueryDefinitionReaderPort {
  constructor(
    private readonly queryDefinitions: RuntimeQueryDefinitionReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndId(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<RuntimeQueryDefinitionLike | null> {
    try {
      const queryDefinition = await this.queryDefinitions.findOne(tenantId, queryDefinitionId);

      if (!queryDefinition || !hasRuntimeReaderTenant(queryDefinition, tenantId)) {
        return null;
      }

      const id = getRuntimeReaderEntityId(queryDefinition);
      const queryKey = toRuntimeReaderString(queryDefinition.queryKey);
      const status = toRuntimeReaderString(queryDefinition.status);

      if (!id || !queryKey || !status) {
        return null;
      }

      return {
        id,
        tenantId,
        datasetId: toRuntimeReaderString(queryDefinition.datasetId),
        queryKey,
        status,
        type: toRuntimeReaderString(queryDefinition.type),
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          queryDefinition.metadata,
          queryDefinition.safeMetadata,
          {
            status,
            type: toRuntimeReaderString(queryDefinition.type),
          },
        ),
      };
    } catch {
      return null;
    }
  }
}
