/**
 * Size note: this file is above the 500-line guideline (see CLAUDE.md /
 * AGENTS.md). It is intentionally one cohesive unit — the runtime connector
 * reference resolver together with the reader-port and `*Like` contract
 * interfaces it consumes. A full decomposition is deferred to a dedicated,
 * test-driven refactor that must not change public contracts; the
 * runtime/bridge area stays foundation-only (ADR-0014/0015, gated by
 * ADR-0021/0022).
 */
import { ExecutionRequestKind } from '../schemas/execution-request.schema';
import { BridgeReadinessBlockerShape, ExecutionRequestLike } from './bridge-types';
import { ConnectorCommandSafeMetadata } from './connector-command-shape';
import {
  isRuntimeConnectorSuspiciousConnectionId,
  isRuntimeConnectorSuspiciousCredentialRef,
} from './runtime-connector-security';
import {
  RuntimeConnectorFieldMappingDescriptor,
  RuntimeConnectorLogicalFieldDescriptor,
  RuntimeConnectorReferenceBundle,
  RuntimeConnectorSourceDescriptor,
} from './runtime-connector-reference.types';
import { RuntimeConnectorSafeMetadataBuilder } from './runtime-connector-safe-metadata-builder';

export interface RuntimeQueryDefinitionLike {
  readonly id: string;
  readonly tenantId: string;
  readonly datasetId?: string;
  readonly queryKey: string;
  readonly status: string;
  readonly type?: string;
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeDashboardDefinitionWidgetLike {
  readonly key: string;
  readonly queryDefinitionId?: string;
  readonly type?: string;
}

export interface RuntimeDashboardDefinitionLike {
  readonly id: string;
  readonly tenantId: string;
  readonly dashboardKey: string;
  readonly widgets: readonly RuntimeDashboardDefinitionWidgetLike[];
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeReportDefinitionBlockLike {
  readonly key: string;
  readonly queryDefinitionId?: string;
  readonly dashboardDefinitionId?: string;
  readonly type?: string;
}

export interface RuntimeReportDefinitionLike {
  readonly id: string;
  readonly tenantId: string;
  readonly reportKey: string;
  readonly queryDefinitionId?: string;
  readonly dashboardDefinitionId?: string;
  readonly blocks: readonly RuntimeReportDefinitionBlockLike[];
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeDatasetLike {
  readonly id: string;
  readonly tenantId: string;
  readonly datasetKey?: string;
  readonly connectionId?: string;
  readonly sourceType?: string;
  readonly status: string;
  readonly schemaMappingVersion?: string;
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeFieldMappingLike {
  readonly id: string;
  readonly tenantId: string;
  readonly datasetKey: string;
  readonly targetField: string;
  readonly sourceField?: string;
  readonly sourcePath?: string;
  readonly sourceObject?: string;
  readonly sourceFieldPath?: string;
  readonly logicalField?: string;
  readonly dataType?: string;
  readonly targetType?: string;
  readonly required?: boolean;
  readonly status: string;
  readonly transform?: string;
  readonly connectionId?: string;
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeConnectionLike {
  readonly id: string;
  readonly tenantId: string;
  readonly type?: string;
  readonly sourceType?: string;
  readonly status: string;
  readonly credentialRef?: string;
  readonly authType?: string;
  readonly requiresCredential?: boolean;
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeCredentialReferenceLike {
  readonly credentialRef: string;
  readonly tenantId?: string;
  readonly connectionId?: string;
  readonly status: string;
  readonly provider?: string;
  readonly type?: string;
  readonly safeMetadata?: Record<string, unknown>;
}

export interface RuntimeQueryDefinitionReaderPort {
  findByTenantAndId(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<RuntimeQueryDefinitionLike | null>;
}

export interface RuntimeDashboardDefinitionReaderPort {
  findByTenantAndId(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<RuntimeDashboardDefinitionLike | null>;
}

export interface RuntimeReportDefinitionReaderPort {
  findByTenantAndId(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<RuntimeReportDefinitionLike | null>;
}

export interface RuntimeDatasetReaderPort {
  findByTenantAndId(tenantId: string, datasetId: string): Promise<RuntimeDatasetLike | null>;
}

export interface RuntimeFieldMappingReaderPort {
  findByTenantAndDatasetKey(
    tenantId: string,
    datasetKey: string,
  ): Promise<readonly RuntimeFieldMappingLike[]>;
}

export interface RuntimeConnectionReaderPort {
  findByTenantAndId(tenantId: string, connectionId: string): Promise<RuntimeConnectionLike | null>;
}

export interface RuntimeCredentialReferenceReaderPort {
  findByTenantAndCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLike | null>;
}

export interface ResolveRuntimeConnectorReferencesInput {
  readonly executionRequest: ExecutionRequestLike;
  readonly tenantId: string;
}

export interface ResolveRuntimeConnectorReferencesResult {
  readonly resolved: boolean;
  readonly references?: RuntimeConnectorReferenceBundle;
  readonly blockers: readonly BridgeReadinessBlockerShape[];
  readonly safeMetadata: ConnectorCommandSafeMetadata;
}

export interface RuntimeConnectorReferenceResolverDependencies {
  readonly queryDefinitionReader: RuntimeQueryDefinitionReaderPort;
  readonly dashboardDefinitionReader: RuntimeDashboardDefinitionReaderPort;
  readonly reportDefinitionReader: RuntimeReportDefinitionReaderPort;
  readonly datasetReader: RuntimeDatasetReaderPort;
  readonly fieldMappingReader: RuntimeFieldMappingReaderPort;
  readonly connectionReader: RuntimeConnectionReaderPort;
  readonly credentialReferenceReader?: RuntimeCredentialReferenceReaderPort;
  readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder;
}

interface PartialReferenceBundle {
  readonly queryDefinitionIds: readonly string[];
  readonly dashboardDefinitionIds: readonly string[];
  readonly reportDefinitionIds: readonly string[];
  readonly datasetId: string;
  readonly connectionId: string;
  readonly credentialRef?: string;
  readonly sourceType: string;
  readonly sourceDescriptor: RuntimeConnectorSourceDescriptor;
  readonly fieldMappings: readonly RuntimeConnectorFieldMappingDescriptor[];
  readonly logicalFields: readonly RuntimeConnectorLogicalFieldDescriptor[];
  readonly schemaMappingVersion?: string;
  readonly safeMetadata: ConnectorCommandSafeMetadata;
}

type PartialResolution =
  | { readonly resolved: true; readonly bundle: PartialReferenceBundle }
  | {
      readonly resolved: false;
      readonly blockers: readonly BridgeReadinessBlockerShape[];
      readonly safeMetadata?: ConnectorCommandSafeMetadata;
    };

export class RuntimeConnectorReferenceResolver {
  constructor(private readonly dependencies: RuntimeConnectorReferenceResolverDependencies) {}

  async resolveReferences(
    input: ResolveRuntimeConnectorReferencesInput,
  ): Promise<ResolveRuntimeConnectorReferencesResult> {
    try {
      return await this.resolveReferencesSafely(input);
    } catch {
      return this.blocked('reference_resolution_failed', 'Reference resolution failed safely.');
    }
  }

  private async resolveReferencesSafely(
    input: ResolveRuntimeConnectorReferencesInput,
  ): Promise<ResolveRuntimeConnectorReferencesResult> {
    if (!input.tenantId) {
      return this.blocked('tenant_mismatch', 'tenantId is required for reference resolution.');
    }

    if (input.executionRequest.tenantId !== input.tenantId) {
      return this.blocked(
        'tenant_mismatch',
        'Execution request does not belong to the requested tenant.',
        'executionRequest.tenantId',
      );
    }

    switch (input.executionRequest.kind) {
      case 'query':
        return this.resolveQueryRoot(input);
      case 'dashboard':
        return this.resolveDashboardRoot(input);
      case 'report':
        return this.resolveReportRoot(input);
      default:
        return this.blocked('unsupported_kind', 'Execution request kind is not supported.');
    }
  }

  private async resolveQueryRoot(
    input: ResolveRuntimeConnectorReferencesInput,
  ): Promise<ResolveRuntimeConnectorReferencesResult> {
    if (!input.executionRequest.queryDefinitionId) {
      return this.blocked(
        'query_definition_missing',
        'Query definition reference is required.',
        'executionRequest.queryDefinitionId',
      );
    }

    const query = await this.dependencies.queryDefinitionReader.findByTenantAndId(
      input.tenantId,
      input.executionRequest.queryDefinitionId,
    );

    if (!query || query.tenantId !== input.tenantId) {
      return this.blocked(
        'query_definition_missing',
        'Query definition was not found for this tenant.',
        'executionRequest.queryDefinitionId',
      );
    }

    const partial = await this.resolveQuery(query.id, input.tenantId);
    if (!partial.resolved) {
      return this.unresolved(partial.blockers, partial.safeMetadata);
    }

    return this.resolved(input, partial.bundle, {
      kind: ExecutionRequestKind.Query,
      id: query.id,
    });
  }

  private async resolveDashboardRoot(
    input: ResolveRuntimeConnectorReferencesInput,
  ): Promise<ResolveRuntimeConnectorReferencesResult> {
    if (!input.executionRequest.dashboardDefinitionId) {
      return this.blocked(
        'dashboard_definition_missing',
        'Dashboard definition reference is required.',
        'executionRequest.dashboardDefinitionId',
      );
    }

    const partial = await this.resolveDashboard(
      input.executionRequest.dashboardDefinitionId,
      input.tenantId,
    );
    if (!partial.resolved) {
      return this.unresolved(partial.blockers, partial.safeMetadata);
    }

    return this.resolved(input, partial.bundle, {
      kind: ExecutionRequestKind.Dashboard,
      id: input.executionRequest.dashboardDefinitionId,
    });
  }

  private async resolveReportRoot(
    input: ResolveRuntimeConnectorReferencesInput,
  ): Promise<ResolveRuntimeConnectorReferencesResult> {
    if (!input.executionRequest.reportDefinitionId) {
      return this.blocked(
        'report_definition_missing',
        'Report definition reference is required.',
        'executionRequest.reportDefinitionId',
      );
    }

    const partial = await this.resolveReport(
      input.executionRequest.reportDefinitionId,
      input.tenantId,
    );
    if (!partial.resolved) {
      return this.unresolved(partial.blockers, partial.safeMetadata);
    }

    return this.resolved(input, partial.bundle, {
      kind: ExecutionRequestKind.Report,
      id: input.executionRequest.reportDefinitionId,
    });
  }

  private async resolveQuery(
    queryDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!queryDefinitionId) {
      return this.unresolvedPartial(
        this.blocker('query_definition_missing', 'Query definition reference is required.'),
      );
    }

    const query = await this.dependencies.queryDefinitionReader.findByTenantAndId(
      tenantId,
      queryDefinitionId,
    );

    if (!query || query.tenantId !== tenantId) {
      return this.unresolvedPartial(
        this.blocker('query_definition_missing', 'Query definition was not found for this tenant.'),
      );
    }

    if (!query.datasetId) {
      return this.unresolvedPartial(
        this.blocker(
          'dataset_missing',
          'Query definition does not reference a dataset.',
          'queryDefinition.datasetId',
        ),
      );
    }

    const chain = await this.resolveDatasetChain(query.datasetId, tenantId);
    if (!chain.resolved) {
      return chain;
    }

    return {
      resolved: true,
      bundle: {
        ...chain.bundle,
        queryDefinitionIds: this.unique([...chain.bundle.queryDefinitionIds, query.id]),
      },
    };
  }

  private async resolveDashboard(
    dashboardDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!dashboardDefinitionId) {
      return this.unresolvedPartial(
        this.blocker('dashboard_definition_missing', 'Dashboard definition reference is required.'),
      );
    }

    const dashboard = await this.dependencies.dashboardDefinitionReader.findByTenantAndId(
      tenantId,
      dashboardDefinitionId,
    );

    if (!dashboard || dashboard.tenantId !== tenantId) {
      return this.unresolvedPartial(
        this.blocker(
          'dashboard_definition_missing',
          'Dashboard definition was not found for this tenant.',
        ),
      );
    }

    const queryIds = dashboard.widgets
      .map((widget) => widget.queryDefinitionId)
      .filter((queryDefinitionId): queryDefinitionId is string => Boolean(queryDefinitionId));

    if (queryIds.length === 0) {
      return this.unresolvedPartial(
        this.blocker(
          'query_definition_missing',
          'Dashboard has no widgets with queryDefinitionId.',
          'dashboard.widgets',
        ),
      );
    }

    const merged = await this.resolveAndMergePartials(
      queryIds.map((queryId) => () => this.resolveQuery(queryId, tenantId)),
    );

    if (!merged.resolved) {
      return merged;
    }

    return {
      resolved: true,
      bundle: {
        ...merged.bundle,
        dashboardDefinitionIds: this.unique([
          ...merged.bundle.dashboardDefinitionIds,
          dashboard.id,
        ]),
      },
    };
  }

  private async resolveReport(
    reportDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!reportDefinitionId) {
      return this.unresolvedPartial(
        this.blocker('report_definition_missing', 'Report definition reference is required.'),
      );
    }

    const report = await this.dependencies.reportDefinitionReader.findByTenantAndId(
      tenantId,
      reportDefinitionId,
    );

    if (!report || report.tenantId !== tenantId) {
      return this.unresolvedPartial(
        this.blocker(
          'report_definition_missing',
          'Report definition was not found for this tenant.',
        ),
      );
    }

    const resolvers: Array<() => Promise<PartialResolution>> = [];

    if (report.queryDefinitionId) {
      resolvers.push(() => this.resolveQuery(report.queryDefinitionId, tenantId));
    }

    if (report.dashboardDefinitionId) {
      resolvers.push(() => this.resolveDashboard(report.dashboardDefinitionId, tenantId));
    }

    report.blocks.forEach((block) => {
      if (block.queryDefinitionId) {
        resolvers.push(() => this.resolveQuery(block.queryDefinitionId, tenantId));
        return;
      }

      if (block.dashboardDefinitionId) {
        resolvers.push(() => this.resolveDashboard(block.dashboardDefinitionId, tenantId));
      }
    });

    if (resolvers.length === 0) {
      return this.unresolvedPartial(
        this.blocker(
          'report_definition_missing',
          'Report has no resolvable query or dashboard reference.',
          'reportDefinition',
        ),
      );
    }

    const merged = await this.resolveAndMergePartials(resolvers);
    if (!merged.resolved) {
      return merged;
    }

    return {
      resolved: true,
      bundle: {
        ...merged.bundle,
        reportDefinitionIds: this.unique([...merged.bundle.reportDefinitionIds, report.id]),
      },
    };
  }

  private async resolveDatasetChain(
    datasetId: string,
    tenantId: string,
  ): Promise<PartialResolution> {
    const dataset = await this.dependencies.datasetReader.findByTenantAndId(tenantId, datasetId);

    if (!dataset || dataset.tenantId !== tenantId) {
      return this.unresolvedPartial(
        this.blocker('dataset_missing', 'Dataset was not found for this tenant.', 'datasetId'),
      );
    }

    if (!dataset.datasetKey) {
      return this.unresolvedPartial(
        this.blocker('dataset_key_missing', 'Dataset key is required.', 'dataset.datasetKey'),
      );
    }

    const fieldMappings = await this.dependencies.fieldMappingReader.findByTenantAndDatasetKey(
      tenantId,
      dataset.datasetKey,
    );

    if (fieldMappings.length === 0) {
      return this.unresolvedPartial(
        this.blocker(
          'field_mappings_missing',
          'No field mappings are configured for this dataset.',
          'dataset.fieldMappings',
        ),
      );
    }

    const connectionId =
      dataset.connectionId ?? fieldMappings.find((mapping) => mapping.connectionId)?.connectionId;
    if (!connectionId || isRuntimeConnectorSuspiciousConnectionId(connectionId)) {
      return this.unresolvedPartial(
        this.blocker(
          'connection_missing',
          'Connection reference is required.',
          'dataset.connectionId',
        ),
      );
    }

    const connection = await this.dependencies.connectionReader.findByTenantAndId(
      tenantId,
      connectionId,
    );
    if (!connection || connection.tenantId !== tenantId) {
      return this.unresolvedPartial(
        this.blocker(
          'connection_missing',
          'Connection was not found for this tenant.',
          'connectionId',
        ),
      );
    }

    const sourceType = connection.sourceType ?? dataset.sourceType ?? connection.type;
    if (!sourceType) {
      return this.unresolvedPartial(
        this.blocker('source_type_missing', 'Source type is required.', 'connection.sourceType'),
      );
    }

    const credentialRefResult = await this.resolveCredentialRef(tenantId, connection);
    if (!credentialRefResult.resolved) {
      return credentialRefResult;
    }

    const descriptors = this.buildFieldMappingDescriptors(dataset, fieldMappings);
    if (descriptors.length === 0) {
      return this.unresolvedPartial(
        this.blocker(
          'field_mappings_missing',
          'No usable field mappings are configured for this dataset.',
          'dataset.fieldMappings',
        ),
      );
    }

    const sourceDescriptor = this.buildSourceDescriptor(
      sourceType,
      connection,
      credentialRefResult.credentialRef,
      dataset,
      descriptors,
    );
    const safeMetadata = this.dependencies.safeMetadataBuilder.build({
      metadata: {
        ...dataset.safeMetadata,
        ...connection.safeMetadata,
        sourceType,
        mappingsCount: descriptors.length,
      },
    });

    return {
      resolved: true,
      bundle: {
        queryDefinitionIds: [],
        dashboardDefinitionIds: [],
        reportDefinitionIds: [],
        datasetId: dataset.id,
        connectionId: connection.id,
        credentialRef: credentialRefResult.credentialRef,
        sourceType,
        sourceDescriptor,
        fieldMappings: descriptors,
        logicalFields: this.uniqueLogicalFields(descriptors.map((mapping) => mapping.logical)),
        schemaMappingVersion: dataset.schemaMappingVersion,
        safeMetadata,
      },
    };
  }

  private async resolveCredentialRef(
    tenantId: string,
    connection: RuntimeConnectionLike,
  ): Promise<
    | { readonly resolved: true; readonly credentialRef?: string }
    | { readonly resolved: false; readonly blockers: readonly BridgeReadinessBlockerShape[] }
  > {
    const credentialRequired =
      connection.requiresCredential ??
      !['none', 'manual', 'computed'].includes(connection.authType ?? '');

    if (!connection.credentialRef) {
      if (!credentialRequired) {
        return { resolved: true };
      }

      return {
        resolved: false,
        blockers: [
          this.blocker(
            'credential_ref_missing',
            'Connection has no credentialRef.',
            'connection.credentialRef',
          ),
        ],
      };
    }

    if (isRuntimeConnectorSuspiciousCredentialRef(connection.credentialRef)) {
      return {
        resolved: false,
        blockers: [
          this.blocker(
            'credential_ref_missing',
            'Connection credentialRef is not safe for runtime preparation.',
            'connection.credentialRef',
          ),
        ],
      };
    }

    if (!this.dependencies.credentialReferenceReader) {
      return {
        resolved: true,
        credentialRef: connection.credentialRef,
      };
    }

    const credential =
      await this.dependencies.credentialReferenceReader.findByTenantAndCredentialRef(
        tenantId,
        connection.credentialRef,
      );

    if (!credential || (credential.tenantId && credential.tenantId !== tenantId)) {
      return {
        resolved: false,
        blockers: [
          this.blocker(
            'credential_ref_missing',
            'Credential reference was not found for this tenant.',
            'connection.credentialRef',
          ),
        ],
      };
    }

    if (credential.status !== 'active') {
      return {
        resolved: false,
        blockers: [
          this.blocker(
            'credential_ref_missing',
            'Credential reference is not active.',
            'connection.credentialRef',
          ),
        ],
      };
    }

    return {
      resolved: true,
      credentialRef: credential.credentialRef,
    };
  }

  private buildFieldMappingDescriptors(
    dataset: RuntimeDatasetLike,
    mappings: readonly RuntimeFieldMappingLike[],
  ): RuntimeConnectorFieldMappingDescriptor[] {
    return mappings
      .filter((mapping) => mapping.tenantId === dataset.tenantId)
      .map<RuntimeConnectorFieldMappingDescriptor | undefined>((mapping) => {
        const sourceFieldPath =
          mapping.sourceFieldPath ?? mapping.sourceField ?? mapping.sourcePath;
        if (!sourceFieldPath) {
          return undefined;
        }

        const logicalField = mapping.logicalField ?? mapping.targetField;
        const dataType = mapping.dataType ?? mapping.targetType;
        const safeMetadata = this.dependencies.safeMetadataBuilder.build({
          metadata: mapping.safeMetadata,
        });

        return {
          fieldMappingId: mapping.id,
          datasetId: dataset.id,
          datasetKey: dataset.datasetKey,
          targetField: mapping.targetField,
          sourceObject: mapping.sourceObject,
          sourceFieldPath,
          logicalField,
          dataType,
          required: mapping.required,
          safeMetadata,
          source: {
            sourceObject: mapping.sourceObject,
            sourceFieldPath,
            sourceFieldType: dataType,
            required: mapping.required,
          },
          logical: {
            logicalField,
            dataType,
            logicalType: dataType,
            required: mapping.required,
            sourceFieldPath,
            safeMetadata,
          },
          transform: mapping.transform,
          status: mapping.status,
        };
      })
      .filter(
        (mapping): mapping is RuntimeConnectorFieldMappingDescriptor => mapping !== undefined,
      );
  }

  private buildSourceDescriptor(
    sourceType: string,
    connection: RuntimeConnectionLike,
    credentialRef: string | undefined,
    dataset: RuntimeDatasetLike,
    mappings: readonly RuntimeConnectorFieldMappingDescriptor[],
  ): RuntimeConnectorSourceDescriptor {
    const firstMapping = mappings[0];
    const safeMetadata = this.dependencies.safeMetadataBuilder.build({
      metadata: {
        ...dataset.safeMetadata,
        ...connection.safeMetadata,
        sourceType,
        sourceObject: firstMapping?.sourceObject,
        sourceFieldPath: firstMapping?.sourceFieldPath,
      },
    });

    return {
      sourceType,
      connectionId: connection.id,
      credentialRef,
      sourceObject: firstMapping?.sourceObject,
      sourceFieldPath: firstMapping?.sourceFieldPath,
      schemaMappingVersion: dataset.schemaMappingVersion,
      safeMetadata,
      metadata: safeMetadata,
    };
  }

  private async resolveAndMergePartials(
    resolvers: readonly (() => Promise<PartialResolution>)[],
  ): Promise<PartialResolution> {
    const partials: PartialReferenceBundle[] = [];

    for (const resolver of resolvers) {
      const partial = await resolver();
      if (!partial.resolved) {
        return partial;
      }

      partials.push(partial.bundle);
    }

    return this.mergePartials(partials);
  }

  private mergePartials(partials: readonly PartialReferenceBundle[]): PartialResolution {
    const sourceKeys = new Set(
      partials.map(
        (partial) =>
          `${partial.connectionId}:${partial.sourceType}:${partial.credentialRef ?? 'none'}`,
      ),
    );

    if (sourceKeys.size > 1) {
      return this.unresolvedPartial(
        this.blocker(
          'multiple_sources_not_supported',
          'Multiple source references are not supported by this foundation resolver.',
        ),
      );
    }

    const first = partials[0];
    if (!first) {
      return this.unresolvedPartial(
        this.blocker('reference_resolution_failed', 'No references were resolved.'),
      );
    }

    const fieldMappings = this.uniqueFieldMappings(
      partials.flatMap((partial) => partial.fieldMappings),
    );

    return {
      resolved: true,
      bundle: {
        ...first,
        queryDefinitionIds: this.unique(partials.flatMap((partial) => partial.queryDefinitionIds)),
        dashboardDefinitionIds: this.unique(
          partials.flatMap((partial) => partial.dashboardDefinitionIds),
        ),
        reportDefinitionIds: this.unique(
          partials.flatMap((partial) => partial.reportDefinitionIds),
        ),
        fieldMappings,
        logicalFields: this.uniqueLogicalFields(fieldMappings.map((mapping) => mapping.logical)),
        safeMetadata: this.dependencies.safeMetadataBuilder.build({
          metadata: {
            ...first.safeMetadata,
            queryDefinitionsCount: this.unique(
              partials.flatMap((partial) => partial.queryDefinitionIds),
            ).length,
            dashboardDefinitionsCount: this.unique(
              partials.flatMap((partial) => partial.dashboardDefinitionIds),
            ).length,
            reportDefinitionsCount: this.unique(
              partials.flatMap((partial) => partial.reportDefinitionIds),
            ).length,
            fieldMappingsCount: fieldMappings.length,
          },
        }),
      },
    };
  }

  private resolved(
    input: ResolveRuntimeConnectorReferencesInput,
    partial: PartialReferenceBundle,
    rootReference: RuntimeConnectorReferenceBundle['rootReference'],
  ): ResolveRuntimeConnectorReferencesResult {
    const fieldMappings = this.uniqueFieldMappings(partial.fieldMappings);
    const references: RuntimeConnectorReferenceBundle = {
      executionRequestId: input.executionRequest.id,
      tenantId: input.tenantId,
      kind: input.executionRequest.kind,
      mode: input.executionRequest.mode,
      rootReference,
      connectionId: partial.connectionId,
      credentialRef: partial.credentialRef,
      datasetId: partial.datasetId,
      fieldMappingIds: fieldMappings.map((mapping) => mapping.fieldMappingId),
      queryDefinitionId: partial.queryDefinitionIds[0],
      dashboardDefinitionId: partial.dashboardDefinitionIds[0],
      reportDefinitionId: partial.reportDefinitionIds[0],
      sourceType: partial.sourceType,
      sourceDescriptor: partial.sourceDescriptor,
      source: partial.sourceDescriptor,
      fieldMappings,
      logicalFields: this.uniqueLogicalFields(fieldMappings.map((mapping) => mapping.logical)),
      schemaMappingVersion: partial.schemaMappingVersion,
      safeMetadata: this.dependencies.safeMetadataBuilder.build({
        metadata: {
          ...partial.safeMetadata,
          kind: input.executionRequest.kind,
          mode: input.executionRequest.mode,
          rootReferenceKind: rootReference.kind,
          sourceType: partial.sourceType,
          fieldMappingsCount: fieldMappings.length,
        },
      }),
    };

    return {
      resolved: true,
      references,
      blockers: [],
      safeMetadata: references.safeMetadata,
    };
  }

  private blocked(
    code: string,
    message: string,
    target?: string,
  ): ResolveRuntimeConnectorReferencesResult {
    const blockers = [this.blocker(code, message, target)];

    return this.unresolved(blockers);
  }

  private unresolved(
    blockers: readonly BridgeReadinessBlockerShape[],
    safeMetadata?: ConnectorCommandSafeMetadata,
  ): ResolveRuntimeConnectorReferencesResult {
    return {
      resolved: false,
      blockers,
      safeMetadata:
        safeMetadata ??
        this.dependencies.safeMetadataBuilder.build({
          metadata: {
            blockersCount: blockers.length,
            blockerCode: blockers[0]?.code,
          },
        }),
    };
  }

  private unresolvedPartial(blocker: BridgeReadinessBlockerShape): PartialResolution {
    return {
      resolved: false,
      blockers: [blocker],
      safeMetadata: this.dependencies.safeMetadataBuilder.build({
        metadata: {
          blockerCode: blocker.code,
        },
      }),
    };
  }

  private blocker(code: string, message: string, target?: string): BridgeReadinessBlockerShape {
    return {
      code,
      message,
      target,
    };
  }

  private unique(values: readonly string[]): string[] {
    return [...new Set(values.filter((value) => value.trim().length > 0))];
  }

  private uniqueFieldMappings(
    mappings: readonly RuntimeConnectorFieldMappingDescriptor[],
  ): RuntimeConnectorFieldMappingDescriptor[] {
    const seen = new Set<string>();

    return mappings.filter((mapping) => {
      if (seen.has(mapping.fieldMappingId)) {
        return false;
      }

      seen.add(mapping.fieldMappingId);
      return true;
    });
  }

  private uniqueLogicalFields(
    fields: readonly RuntimeConnectorLogicalFieldDescriptor[],
  ): RuntimeConnectorLogicalFieldDescriptor[] {
    const seen = new Set<string>();

    return fields.filter((field) => {
      if (seen.has(field.logicalField)) {
        return false;
      }

      seen.add(field.logicalField);
      return true;
    });
  }
}
