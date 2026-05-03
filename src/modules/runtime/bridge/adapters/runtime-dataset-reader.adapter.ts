import {
  RuntimeDatasetLike,
  RuntimeDatasetReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeDatasetReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly datasetKey?: unknown;
  readonly connectionId?: unknown;
  readonly sourceType?: unknown;
  readonly status?: unknown;
  readonly schemaMappingVersion?: unknown;
}

export interface RuntimeDatasetReaderAdapterDependency {
  findOne(tenantId: string, datasetId: string): Promise<RuntimeDatasetReaderAdapterSource | null>;
}

export class RuntimeDatasetReaderAdapter implements RuntimeDatasetReaderPort {
  constructor(
    private readonly datasets: RuntimeDatasetReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndId(tenantId: string, datasetId: string): Promise<RuntimeDatasetLike | null> {
    try {
      const dataset = await this.datasets.findOne(tenantId, datasetId);

      if (!dataset || !hasRuntimeReaderTenant(dataset, tenantId)) {
        return null;
      }

      const id = getRuntimeReaderEntityId(dataset);
      const status = toRuntimeReaderString(dataset.status);

      if (!id || !status) {
        return null;
      }

      return {
        id,
        tenantId,
        datasetKey: toRuntimeReaderString(dataset.datasetKey),
        connectionId: toRuntimeReaderString(dataset.connectionId),
        sourceType: toRuntimeReaderString(dataset.sourceType),
        status,
        schemaMappingVersion: toRuntimeReaderString(dataset.schemaMappingVersion),
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          dataset.metadata,
          dataset.safeMetadata,
          {
            status,
            sourceType: toRuntimeReaderString(dataset.sourceType),
            schemaMappingVersion: toRuntimeReaderString(dataset.schemaMappingVersion),
          },
        ),
      };
    } catch {
      return null;
    }
  }
}
