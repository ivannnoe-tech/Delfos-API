/**
 * Type contracts for the runtime connector reference resolver: the `*Like`
 * declarative shapes, reader ports, resolver IO and the dependency container,
 * plus the internal partial-resolution types shared by the resolver and its
 * partial resolver. Extracted from `runtime-connector-reference-resolver.ts`
 * so each file stays within the size guideline. No runtime/dispatch behavior
 * here — foundation-only (ADR-0014/0015, gated by ADR-0021/0022).
 */
import { BridgeReadinessBlockerShape, ExecutionRequestLike } from './bridge-types';
import { ConnectorCommandSafeMetadata } from './connector-command-shape';
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

/**
 * Internal partial reference bundle accumulated while resolving a single
 * source chain. Exported so the resolver and its partial resolver can share
 * the same shape; not part of the connector command public contract.
 */
export interface PartialReferenceBundle {
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

/** Internal resolution outcome for a partial source chain. */
export type PartialResolution =
  | { readonly resolved: true; readonly bundle: PartialReferenceBundle }
  | {
      readonly resolved: false;
      readonly blockers: readonly BridgeReadinessBlockerShape[];
      readonly safeMetadata?: ConnectorCommandSafeMetadata;
    };
