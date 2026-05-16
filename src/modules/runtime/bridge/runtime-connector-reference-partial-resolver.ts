/**
 * Partial resolver for the runtime connector reference resolver. Resolves a
 * single query/dashboard/report into a partial reference bundle, walks the
 * dataset -> field mappings -> connection -> credentialRef chain and merges
 * partials under a conservative single-source policy. Extracted from
 * `runtime-connector-reference-resolver.ts` so each file stays within the
 * size guideline. No runtime/dispatch behavior here — foundation-only
 * (ADR-0014/0015, gated by ADR-0021/0022).
 */
import { BridgeReadinessBlockerShape } from './bridge-types';
import {
  isRuntimeConnectorSuspiciousConnectionId,
  isRuntimeConnectorSuspiciousCredentialRef,
} from './runtime-connector-security';
import {
  PartialReferenceBundle,
  PartialResolution,
  RuntimeConnectionLike,
  RuntimeConnectorReferenceResolverDependencies,
} from './runtime-connector-reference-resolver.types';
import {
  buildFieldMappingDescriptors,
  buildReadinessBlocker,
  buildSourceDescriptor,
  uniqueFieldMappings,
  uniqueLogicalFields,
  uniqueStrings,
  unresolvedPartial,
} from './runtime-connector-reference-resolver.support';

export class RuntimeConnectorReferencePartialResolver {
  constructor(private readonly dependencies: RuntimeConnectorReferenceResolverDependencies) {}

  async resolveQuery(
    queryDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!queryDefinitionId) {
      return this.blockedPartial(
        'query_definition_missing',
        'Query definition reference is required.',
      );
    }

    const query = await this.dependencies.queryDefinitionReader.findByTenantAndId(
      tenantId,
      queryDefinitionId,
    );

    if (!query || query.tenantId !== tenantId) {
      return this.blockedPartial(
        'query_definition_missing',
        'Query definition was not found for this tenant.',
      );
    }

    if (!query.datasetId) {
      return this.blockedPartial(
        'dataset_missing',
        'Query definition does not reference a dataset.',
        'queryDefinition.datasetId',
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
        queryDefinitionIds: uniqueStrings([...chain.bundle.queryDefinitionIds, query.id]),
      },
    };
  }

  async resolveDashboard(
    dashboardDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!dashboardDefinitionId) {
      return this.blockedPartial(
        'dashboard_definition_missing',
        'Dashboard definition reference is required.',
      );
    }

    const dashboard = await this.dependencies.dashboardDefinitionReader.findByTenantAndId(
      tenantId,
      dashboardDefinitionId,
    );

    if (!dashboard || dashboard.tenantId !== tenantId) {
      return this.blockedPartial(
        'dashboard_definition_missing',
        'Dashboard definition was not found for this tenant.',
      );
    }

    const queryIds = dashboard.widgets
      .map((widget) => widget.queryDefinitionId)
      .filter((queryDefinitionId): queryDefinitionId is string => Boolean(queryDefinitionId));

    if (queryIds.length === 0) {
      return this.blockedPartial(
        'query_definition_missing',
        'Dashboard has no widgets with queryDefinitionId.',
        'dashboard.widgets',
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
        dashboardDefinitionIds: uniqueStrings([
          ...merged.bundle.dashboardDefinitionIds,
          dashboard.id,
        ]),
      },
    };
  }

  async resolveReport(
    reportDefinitionId: string | undefined,
    tenantId: string,
  ): Promise<PartialResolution> {
    if (!reportDefinitionId) {
      return this.blockedPartial(
        'report_definition_missing',
        'Report definition reference is required.',
      );
    }

    const report = await this.dependencies.reportDefinitionReader.findByTenantAndId(
      tenantId,
      reportDefinitionId,
    );

    if (!report || report.tenantId !== tenantId) {
      return this.blockedPartial(
        'report_definition_missing',
        'Report definition was not found for this tenant.',
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
      return this.blockedPartial(
        'report_definition_missing',
        'Report has no resolvable query or dashboard reference.',
        'reportDefinition',
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
        reportDefinitionIds: uniqueStrings([...merged.bundle.reportDefinitionIds, report.id]),
      },
    };
  }

  async resolveDatasetChain(datasetId: string, tenantId: string): Promise<PartialResolution> {
    const dataset = await this.dependencies.datasetReader.findByTenantAndId(tenantId, datasetId);

    if (!dataset || dataset.tenantId !== tenantId) {
      return this.blockedPartial(
        'dataset_missing',
        'Dataset was not found for this tenant.',
        'datasetId',
      );
    }

    if (!dataset.datasetKey) {
      return this.blockedPartial(
        'dataset_key_missing',
        'Dataset key is required.',
        'dataset.datasetKey',
      );
    }

    const fieldMappings = await this.dependencies.fieldMappingReader.findByTenantAndDatasetKey(
      tenantId,
      dataset.datasetKey,
    );

    if (fieldMappings.length === 0) {
      return this.blockedPartial(
        'field_mappings_missing',
        'No field mappings are configured for this dataset.',
        'dataset.fieldMappings',
      );
    }

    const connectionId =
      dataset.connectionId ?? fieldMappings.find((mapping) => mapping.connectionId)?.connectionId;
    if (!connectionId || isRuntimeConnectorSuspiciousConnectionId(connectionId)) {
      return this.blockedPartial(
        'connection_missing',
        'Connection reference is required.',
        'dataset.connectionId',
      );
    }

    const connection = await this.dependencies.connectionReader.findByTenantAndId(
      tenantId,
      connectionId,
    );
    if (!connection || connection.tenantId !== tenantId) {
      return this.blockedPartial(
        'connection_missing',
        'Connection was not found for this tenant.',
        'connectionId',
      );
    }

    const sourceType = connection.sourceType ?? dataset.sourceType ?? connection.type;
    if (!sourceType) {
      return this.blockedPartial(
        'source_type_missing',
        'Source type is required.',
        'connection.sourceType',
      );
    }

    const credentialRefResult = await this.resolveCredentialRef(tenantId, connection);
    if (!credentialRefResult.resolved) {
      return credentialRefResult;
    }

    const descriptors = buildFieldMappingDescriptors(
      this.dependencies.safeMetadataBuilder,
      dataset,
      fieldMappings,
    );
    if (descriptors.length === 0) {
      return this.blockedPartial(
        'field_mappings_missing',
        'No usable field mappings are configured for this dataset.',
        'dataset.fieldMappings',
      );
    }

    const sourceDescriptor = buildSourceDescriptor(
      this.dependencies.safeMetadataBuilder,
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
        logicalFields: uniqueLogicalFields(descriptors.map((mapping) => mapping.logical)),
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
          buildReadinessBlocker(
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
          buildReadinessBlocker(
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
          buildReadinessBlocker(
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
          buildReadinessBlocker(
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
      return this.blockedPartial(
        'multiple_sources_not_supported',
        'Multiple source references are not supported by this foundation resolver.',
      );
    }

    const first = partials[0];
    if (!first) {
      return this.blockedPartial('reference_resolution_failed', 'No references were resolved.');
    }

    const fieldMappings = uniqueFieldMappings(partials.flatMap((partial) => partial.fieldMappings));

    return {
      resolved: true,
      bundle: {
        ...first,
        queryDefinitionIds: uniqueStrings(
          partials.flatMap((partial) => partial.queryDefinitionIds),
        ),
        dashboardDefinitionIds: uniqueStrings(
          partials.flatMap((partial) => partial.dashboardDefinitionIds),
        ),
        reportDefinitionIds: uniqueStrings(
          partials.flatMap((partial) => partial.reportDefinitionIds),
        ),
        fieldMappings,
        logicalFields: uniqueLogicalFields(fieldMappings.map((mapping) => mapping.logical)),
        safeMetadata: this.dependencies.safeMetadataBuilder.build({
          metadata: {
            ...first.safeMetadata,
            queryDefinitionsCount: uniqueStrings(
              partials.flatMap((partial) => partial.queryDefinitionIds),
            ).length,
            dashboardDefinitionsCount: uniqueStrings(
              partials.flatMap((partial) => partial.dashboardDefinitionIds),
            ).length,
            reportDefinitionsCount: uniqueStrings(
              partials.flatMap((partial) => partial.reportDefinitionIds),
            ).length,
            fieldMappingsCount: fieldMappings.length,
          },
        }),
      },
    };
  }

  private blockedPartial(code: string, message: string, target?: string): PartialResolution {
    return unresolvedPartial(
      this.dependencies.safeMetadataBuilder,
      buildReadinessBlocker(code, message, target),
    );
  }
}
