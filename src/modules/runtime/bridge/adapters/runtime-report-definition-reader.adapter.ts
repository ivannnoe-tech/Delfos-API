import {
  RuntimeReportDefinitionBlockLike,
  RuntimeReportDefinitionLike,
  RuntimeReportDefinitionReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  isRuntimeReaderRecord,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderArray,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeReportDefinitionReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly reportKey?: unknown;
  readonly queryDefinitionId?: unknown;
  readonly dashboardDefinitionId?: unknown;
  readonly blocks?: unknown;
  readonly status?: unknown;
  readonly visibility?: unknown;
}

export interface RuntimeReportDefinitionReaderAdapterDependency {
  findOne(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<RuntimeReportDefinitionReaderAdapterSource | null>;
}

export class RuntimeReportDefinitionReaderAdapter implements RuntimeReportDefinitionReaderPort {
  constructor(
    private readonly reportDefinitions: RuntimeReportDefinitionReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndId(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<RuntimeReportDefinitionLike | null> {
    try {
      const reportDefinition = await this.reportDefinitions.findOne(tenantId, reportDefinitionId);

      if (!reportDefinition || !hasRuntimeReaderTenant(reportDefinition, tenantId)) {
        return null;
      }

      const id = getRuntimeReaderEntityId(reportDefinition);
      const reportKey = toRuntimeReaderString(reportDefinition.reportKey);

      if (!id || !reportKey) {
        return null;
      }

      const blocks = toRuntimeReaderArray(reportDefinition.blocks)
        .map((block) => this.toBlock(block))
        .filter((block): block is RuntimeReportDefinitionBlockLike => block !== undefined);

      return {
        id,
        tenantId,
        reportKey,
        queryDefinitionId: toRuntimeReaderString(reportDefinition.queryDefinitionId),
        dashboardDefinitionId: toRuntimeReaderString(reportDefinition.dashboardDefinitionId),
        blocks,
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          reportDefinition.metadata,
          reportDefinition.safeMetadata,
          {
            status: toRuntimeReaderString(reportDefinition.status),
            visibility: toRuntimeReaderString(reportDefinition.visibility),
            blocksCount: blocks.length,
          },
        ),
      };
    } catch {
      return null;
    }
  }

  private toBlock(source: unknown): RuntimeReportDefinitionBlockLike | undefined {
    if (!isRuntimeReaderRecord(source)) {
      return undefined;
    }

    const key = toRuntimeReaderString(source.key);
    if (!key) {
      return undefined;
    }

    return {
      key,
      queryDefinitionId: toRuntimeReaderString(source.queryDefinitionId),
      dashboardDefinitionId: toRuntimeReaderString(source.dashboardDefinitionId),
      type: toRuntimeReaderString(source.type),
    };
  }
}
