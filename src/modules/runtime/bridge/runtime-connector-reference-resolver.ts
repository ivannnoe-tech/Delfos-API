/**
 * Runtime connector reference resolver (root). Validates the tenant boundary,
 * routes by execution request kind and turns a resolved partial bundle into a
 * `RuntimeConnectorReferenceBundle`. Partial source-chain resolution lives in
 * `RuntimeConnectorReferencePartialResolver`; pure helpers in
 * `runtime-connector-reference-resolver.support.ts`; type contracts in
 * `runtime-connector-reference-resolver.types.ts` (re-exported below so the
 * public import path is unchanged). No runtime/dispatch behavior here —
 * foundation-only (ADR-0014/0015, gated by ADR-0021/0022).
 */
import { ExecutionRequestKind } from '../schemas/execution-request.constants';
import { BridgeReadinessBlockerShape } from './bridge-types';
import { ConnectorCommandSafeMetadata } from './connector-command-shape';
import { RuntimeConnectorReferenceBundle } from './runtime-connector-reference.types';
import { RuntimeConnectorReferencePartialResolver } from './runtime-connector-reference-partial-resolver';
import {
  PartialReferenceBundle,
  ResolveRuntimeConnectorReferencesInput,
  ResolveRuntimeConnectorReferencesResult,
  RuntimeConnectorReferenceResolverDependencies,
} from './runtime-connector-reference-resolver.types';
import {
  buildReadinessBlocker,
  uniqueFieldMappings,
  uniqueLogicalFields,
} from './runtime-connector-reference-resolver.support';

export * from './runtime-connector-reference-resolver.types';

export class RuntimeConnectorReferenceResolver {
  private readonly partialResolver: RuntimeConnectorReferencePartialResolver;

  constructor(private readonly dependencies: RuntimeConnectorReferenceResolverDependencies) {
    this.partialResolver = new RuntimeConnectorReferencePartialResolver(dependencies);
  }

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

    const partial = await this.partialResolver.resolveQuery(query.id, input.tenantId);
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

    const partial = await this.partialResolver.resolveDashboard(
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

    const partial = await this.partialResolver.resolveReport(
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

  private resolved(
    input: ResolveRuntimeConnectorReferencesInput,
    partial: PartialReferenceBundle,
    rootReference: RuntimeConnectorReferenceBundle['rootReference'],
  ): ResolveRuntimeConnectorReferencesResult {
    const fieldMappings = uniqueFieldMappings(partial.fieldMappings);
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
      logicalFields: uniqueLogicalFields(fieldMappings.map((mapping) => mapping.logical)),
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
    const blockers = [buildReadinessBlocker(code, message, target)];

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
}
