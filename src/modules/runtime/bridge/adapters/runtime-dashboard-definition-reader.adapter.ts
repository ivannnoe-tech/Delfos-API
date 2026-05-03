import {
  RuntimeDashboardDefinitionLike,
  RuntimeDashboardDefinitionReaderPort,
  RuntimeDashboardDefinitionWidgetLike,
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

export interface RuntimeDashboardDefinitionReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly dashboardKey?: unknown;
  readonly widgets?: unknown;
  readonly status?: unknown;
  readonly visibility?: unknown;
}

export interface RuntimeDashboardDefinitionReaderAdapterDependency {
  findOne(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<RuntimeDashboardDefinitionReaderAdapterSource | null>;
}

export class RuntimeDashboardDefinitionReaderAdapter implements RuntimeDashboardDefinitionReaderPort {
  constructor(
    private readonly dashboardDefinitions: RuntimeDashboardDefinitionReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndId(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<RuntimeDashboardDefinitionLike | null> {
    try {
      const dashboardDefinition = await this.dashboardDefinitions.findOne(
        tenantId,
        dashboardDefinitionId,
      );

      if (!dashboardDefinition || !hasRuntimeReaderTenant(dashboardDefinition, tenantId)) {
        return null;
      }

      const id = getRuntimeReaderEntityId(dashboardDefinition);
      const dashboardKey = toRuntimeReaderString(dashboardDefinition.dashboardKey);

      if (!id || !dashboardKey) {
        return null;
      }

      const widgets = toRuntimeReaderArray(dashboardDefinition.widgets)
        .map((widget) => this.toWidget(widget))
        .filter((widget): widget is RuntimeDashboardDefinitionWidgetLike => widget !== undefined);

      return {
        id,
        tenantId,
        dashboardKey,
        widgets,
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          dashboardDefinition.metadata,
          dashboardDefinition.safeMetadata,
          {
            status: toRuntimeReaderString(dashboardDefinition.status),
            visibility: toRuntimeReaderString(dashboardDefinition.visibility),
            widgetsCount: widgets.length,
          },
        ),
      };
    } catch {
      return null;
    }
  }

  private toWidget(source: unknown): RuntimeDashboardDefinitionWidgetLike | undefined {
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
      type: toRuntimeReaderString(source.type),
    };
  }
}
