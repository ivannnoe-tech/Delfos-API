import {
  RuntimeConnectionReaderAdapter,
  RuntimeConnectionReaderAdapterDependency,
  RuntimeCredentialReferenceReaderAdapter,
  RuntimeCredentialReferenceReaderAdapterDependency,
  RuntimeDashboardDefinitionReaderAdapter,
  RuntimeDashboardDefinitionReaderAdapterDependency,
  RuntimeDatasetReaderAdapter,
  RuntimeDatasetReaderAdapterDependency,
  RuntimeFieldMappingReaderAdapter,
  RuntimeFieldMappingReaderAdapterDependency,
  RuntimeQueryDefinitionReaderAdapter,
  RuntimeQueryDefinitionReaderAdapterDependency,
  RuntimeReportDefinitionReaderAdapter,
  RuntimeReportDefinitionReaderAdapterDependency,
} from './adapters';
import {
  RuntimeClockPort,
  RuntimeExecutionRequestReaderPort,
  RuntimeReadinessEvaluatorPort,
} from './bridge-types';
import {
  RuntimeConnectorBridgeResolver,
  RuntimeSystemClock,
} from './runtime-connector-bridge-resolver';
import { RuntimeConnectorCapabilityMapper } from './runtime-connector-capability-mapper';
import { RuntimeConnectorLocalCommandShapeValidator } from './runtime-connector-command-validation.port';
import { RuntimeConnectorLimitsPolicy } from './runtime-connector-limits-policy';
import { RuntimeConnectorReferenceResolver } from './runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from './runtime-connector-safe-metadata-builder';

/**
 * Structural source shapes for the factory. They are intentionally loose
 * (`object`-valued) so the declarative catalog services/repositories — whose
 * response DTOs are concrete classes without an index signature — satisfy them
 * directly. Each reader adapter sanitizes the source defensively into the
 * minimal `*Like` shape, so this boundary needs no field-level typing.
 */
export interface RuntimeReaderFindOneSource {
  findOne(tenantId: string, id: string): Promise<object | null>;
}

export interface RuntimeFieldMappingSource {
  findByTenantAndDatasetKey?(tenantId: string, datasetKey: string): Promise<readonly object[]>;
  findByFilters?(
    query: Readonly<{
      tenantId: string;
      datasetKey: string;
      page: number;
      pageSize: number;
    }>,
  ): Promise<{ readonly items?: readonly object[] } | readonly object[]>;
}

export interface RuntimeCredentialReferenceSource {
  findByTenantAndCredentialRef?(tenantId: string, credentialRef: string): Promise<object | null>;
  findOne?(tenantId: string, credentialId: string): Promise<object | null>;
}

/**
 * Collaborators required to assemble a real {@link RuntimeConnectorBridgeResolver}.
 * The reader sources are the declarative catalog services/repositories;
 * `executionRequestReader` and `readinessEvaluator` are already-bridged ports.
 * No real connector execution, decryption or dispatch is wired here
 * (ADR-0037 / ADR-0038): this only prepares and validates a command shape in
 * memory and produces safe, audited outcomes.
 */
export interface RuntimeConnectorBridgeResolverFactoryDependencies {
  readonly queryDefinitions: RuntimeReaderFindOneSource;
  readonly dashboardDefinitions: RuntimeReaderFindOneSource;
  readonly reportDefinitions: RuntimeReaderFindOneSource;
  readonly datasets: RuntimeReaderFindOneSource;
  readonly fieldMappings: RuntimeFieldMappingSource;
  readonly connections: RuntimeReaderFindOneSource;
  readonly credentials?: RuntimeCredentialReferenceSource;
  readonly executionRequestReader: RuntimeExecutionRequestReaderPort;
  readonly readinessEvaluator: RuntimeReadinessEvaluatorPort;
  readonly clock?: RuntimeClockPort;
}

export function createRuntimeConnectorBridgeResolver(
  dependencies: RuntimeConnectorBridgeResolverFactoryDependencies,
): RuntimeConnectorBridgeResolver {
  const safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder();

  const referenceResolver = new RuntimeConnectorReferenceResolver({
    queryDefinitionReader: new RuntimeQueryDefinitionReaderAdapter(
      dependencies.queryDefinitions as unknown as RuntimeQueryDefinitionReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    dashboardDefinitionReader: new RuntimeDashboardDefinitionReaderAdapter(
      dependencies.dashboardDefinitions as unknown as RuntimeDashboardDefinitionReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    reportDefinitionReader: new RuntimeReportDefinitionReaderAdapter(
      dependencies.reportDefinitions as unknown as RuntimeReportDefinitionReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    datasetReader: new RuntimeDatasetReaderAdapter(
      dependencies.datasets as unknown as RuntimeDatasetReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    fieldMappingReader: new RuntimeFieldMappingReaderAdapter(
      dependencies.fieldMappings as unknown as RuntimeFieldMappingReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    connectionReader: new RuntimeConnectionReaderAdapter(
      dependencies.connections as unknown as RuntimeConnectionReaderAdapterDependency,
      safeMetadataBuilder,
    ),
    credentialReferenceReader: dependencies.credentials
      ? new RuntimeCredentialReferenceReaderAdapter(
          dependencies.credentials as unknown as RuntimeCredentialReferenceReaderAdapterDependency,
          safeMetadataBuilder,
        )
      : undefined,
    safeMetadataBuilder,
  });

  return new RuntimeConnectorBridgeResolver({
    executionRequestReader: dependencies.executionRequestReader,
    readinessEvaluator: dependencies.readinessEvaluator,
    referenceResolver,
    capabilityMapper: new RuntimeConnectorCapabilityMapper(),
    limitsPolicy: new RuntimeConnectorLimitsPolicy(),
    safeMetadataBuilder,
    commandValidator: new RuntimeConnectorLocalCommandShapeValidator(),
    clock: dependencies.clock ?? new RuntimeSystemClock(),
  });
}
