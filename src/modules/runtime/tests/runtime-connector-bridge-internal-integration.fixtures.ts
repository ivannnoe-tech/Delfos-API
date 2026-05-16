/**
 * Shared harness, fakes and fixtures for the runtime connector bridge
 * internal integration specs. Extracted so the spec files stay within the
 * size guideline while sharing one deterministic, fictitious harness. No
 * real secrets, no dispatch, no real execution.
 */
import {
  BridgeReadinessResult,
  ExecutionRequestLike,
  PrepareRuntimeConnectorCommandInput,
  RuntimeClockPort,
  RuntimeConnectorBridgeResolver,
  RuntimeConnectorBridgeResolverDependencies,
  RuntimeConnectorCapabilityMapper,
  RuntimeConnectorLimitsPolicy,
  RuntimeConnectorLocalCommandShapeValidator,
  RuntimeConnectorReferenceResolver,
  RuntimeConnectorReferenceResolverDependencies,
  RuntimeConnectorSafeMetadataBuilder,
  RuntimeConnectionLike,
  RuntimeCredentialReferenceLike,
  RuntimeDashboardDefinitionLike,
  RuntimeDatasetLike,
  RuntimeExecutionRequestReaderPort,
  RuntimeFieldMappingLike,
  RuntimeQueryDefinitionLike,
  RuntimeReadinessEvaluatorPort,
  RuntimeReportDefinitionLike,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export const TENANT_ID = '662d4f6e7a1c2b00124f0001';
export const OTHER_TENANT_ID = '662d4f6e7a1c2b00124f0002';
export const EXECUTION_REQUEST_ID = '662d4f6e7a1c2b00124f0901';
export const QUERY_DEFINITION_ID = '662d4f6e7a1c2b00124f0601';
export const DASHBOARD_DEFINITION_ID = '662d4f6e7a1c2b00124f0701';
export const REPORT_DEFINITION_ID = '662d4f6e7a1c2b00124f0801';
export const DATASET_ID = '662d4f6e7a1c2b00124f0501';
export const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';
export const CREDENTIAL_REF = 'cred_662d4f6e7a1c2b00124f0401';
export const FIELD_MAPPING_ID = '662d4f6e7a1c2b00124f0511';
export const REQUESTED_AT = '2026-05-03T12:00:00.000Z';

export interface HarnessOptions {
  readonly executionRequests?: readonly ExecutionRequestLike[];
  readonly readiness?: BridgeReadinessResult;
  readonly executionRequestReaderTenantScoped?: boolean;
  readonly queries?: readonly RuntimeQueryDefinitionLike[];
  readonly dashboards?: readonly RuntimeDashboardDefinitionLike[];
  readonly reports?: readonly RuntimeReportDefinitionLike[];
  readonly datasets?: readonly RuntimeDatasetLike[];
  readonly mappings?: readonly RuntimeFieldMappingLike[];
  readonly connections?: readonly RuntimeConnectionLike[];
  readonly credentials?: readonly RuntimeCredentialReferenceLike[];
}

export function createHarness(options: HarnessOptions = {}) {
  const executionRequests = options.executionRequests ?? [createExecutionRequest()];
  const queries = options.queries ?? [createQuery()];
  const dashboards = options.dashboards ?? [createDashboard()];
  const reports = options.reports ?? [createReport()];
  const datasets = options.datasets ?? [createDataset()];
  const mappings = options.mappings ?? [createMapping()];
  const connections = options.connections ?? [createConnection()];
  const credentials = options.credentials ?? [createCredential()];
  const safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder();

  const executionRequestReader: RuntimeExecutionRequestReaderPort = {
    findByTenantAndId: jest.fn(async (tenantId, executionRequestId) => {
      const request = executionRequests.find((item) => item.id === executionRequestId) ?? null;

      if (!request || options.executionRequestReaderTenantScoped === false) {
        return request;
      }

      return request.tenantId === tenantId ? request : null;
    }),
  };
  const readinessEvaluator: RuntimeReadinessEvaluatorPort = {
    evaluate: jest.fn(async () => options.readiness ?? readyReadiness()),
  };
  const queryDefinitionFindByTenantAndId = jest.fn(async (tenantId: string, id: string) =>
    findByTenantAndId(queries, tenantId, id),
  );
  const referenceDependencies: RuntimeConnectorReferenceResolverDependencies = {
    queryDefinitionReader: {
      findByTenantAndId: queryDefinitionFindByTenantAndId,
    },
    dashboardDefinitionReader: {
      findByTenantAndId: jest.fn(async (tenantId, id) =>
        findByTenantAndId(dashboards, tenantId, id),
      ),
    },
    reportDefinitionReader: {
      findByTenantAndId: jest.fn(async (tenantId, id) => findByTenantAndId(reports, tenantId, id)),
    },
    datasetReader: {
      findByTenantAndId: jest.fn(async (tenantId, id) => findByTenantAndId(datasets, tenantId, id)),
    },
    fieldMappingReader: {
      findByTenantAndDatasetKey: jest.fn(async (tenantId, datasetKey) =>
        mappings.filter(
          (mapping) => mapping.tenantId === tenantId && mapping.datasetKey === datasetKey,
        ),
      ),
    },
    connectionReader: {
      findByTenantAndId: jest.fn(
        async (tenantId, id) =>
          connections.find((connection) => {
            const lookupConnectionId =
              (connection as RuntimeConnectionLike & { readonly lookupConnectionId?: string })
                .lookupConnectionId ?? connection.id;

            return connection.tenantId === tenantId && lookupConnectionId === id;
          }) ?? null,
      ),
    },
    credentialReferenceReader: {
      findByTenantAndCredentialRef: jest.fn(
        async (tenantId, credentialRef) =>
          credentials.find((credential) => {
            const lookupCredentialRef =
              (
                credential as RuntimeCredentialReferenceLike & {
                  readonly lookupCredentialRef?: string;
                }
              ).lookupCredentialRef ?? credential.credentialRef;

            return credential.tenantId === tenantId && lookupCredentialRef === credentialRef;
          }) ?? null,
      ),
    },
    safeMetadataBuilder,
  };
  const referenceResolver = new RuntimeConnectorReferenceResolver(referenceDependencies);
  const clock: RuntimeClockPort = {
    now: jest.fn(() => new Date(REQUESTED_AT)),
  };
  const dependencies: RuntimeConnectorBridgeResolverDependencies = {
    executionRequestReader,
    readinessEvaluator,
    referenceResolver,
    capabilityMapper: new RuntimeConnectorCapabilityMapper(),
    limitsPolicy: new RuntimeConnectorLimitsPolicy(),
    safeMetadataBuilder,
    commandValidator: new RuntimeConnectorLocalCommandShapeValidator(),
    clock,
  };

  return {
    bridgeResolver: new RuntimeConnectorBridgeResolver(dependencies),
    referenceResolver,
    dependencies,
    referenceDependencies,
    queryDefinitionFindByTenantAndId,
  };
}

export function findByTenantAndId<T extends { readonly id: string; readonly tenantId: string }>(
  items: readonly T[],
  tenantId: string,
  id: string,
): T | null {
  return items.find((item) => item.tenantId === tenantId && item.id === id) ?? null;
}

export function readyReadiness(): BridgeReadinessResult {
  return {
    checks: [
      {
        code: 'runtime_internal_fixture_ready',
        message: 'Internal fixture references are ready.',
      },
    ],
    warnings: [],
    blockers: [],
  };
}

export function createInput(
  overrides: Partial<PrepareRuntimeConnectorCommandInput> = {},
): PrepareRuntimeConnectorCommandInput {
  return {
    executionRequestId: EXECUTION_REQUEST_ID,
    tenantId: TENANT_ID,
    actorId: 'actor_demo_001',
    actorRole: 'operator',
    requestId: 'req_bridge_001',
    correlationId: 'corr_bridge_001',
    ...overrides,
  };
}

export function createExecutionRequest(
  overrides: Partial<ExecutionRequestLike> = {},
): ExecutionRequestLike {
  return {
    id: EXECUTION_REQUEST_ID,
    tenantId: TENANT_ID,
    kind: ExecutionRequestKind.Query,
    mode: ExecutionRequestMode.FutureRuntime,
    status: ExecutionRequestStatus.Accepted,
    requestKey: `exec_req_${EXECUTION_REQUEST_ID}`,
    queryDefinitionId: QUERY_DEFINITION_ID,
    ...overrides,
  };
}

export function createQuery(
  overrides: Partial<RuntimeQueryDefinitionLike> = {},
): RuntimeQueryDefinitionLike {
  return {
    id: QUERY_DEFINITION_ID,
    tenantId: TENANT_ID,
    datasetId: DATASET_ID,
    queryKey: 'sales_overview',
    status: 'active',
    type: 'metric',
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

export function createDashboard(
  overrides: Partial<RuntimeDashboardDefinitionLike> = {},
): RuntimeDashboardDefinitionLike {
  return {
    id: DASHBOARD_DEFINITION_ID,
    tenantId: TENANT_ID,
    dashboardKey: 'sales_dashboard',
    widgets: [{ key: 'sales_total', queryDefinitionId: QUERY_DEFINITION_ID, type: 'metric_card' }],
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

export function createReport(
  overrides: Partial<RuntimeReportDefinitionLike> = {},
): RuntimeReportDefinitionLike {
  return {
    id: REPORT_DEFINITION_ID,
    tenantId: TENANT_ID,
    reportKey: 'sales_report',
    queryDefinitionId: QUERY_DEFINITION_ID,
    blocks: [{ key: 'sales_table', queryDefinitionId: QUERY_DEFINITION_ID, type: 'table' }],
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

export function createDataset(overrides: Partial<RuntimeDatasetLike> = {}): RuntimeDatasetLike {
  return {
    id: DATASET_ID,
    tenantId: TENANT_ID,
    datasetKey: 'sales_orders',
    connectionId: CONNECTION_ID,
    sourceType: 'sql_server',
    status: 'active',
    schemaMappingVersion: 'mapping_v1',
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

export function createMapping(
  overrides: Partial<RuntimeFieldMappingLike> = {},
): RuntimeFieldMappingLike {
  return {
    id: FIELD_MAPPING_ID,
    tenantId: TENANT_ID,
    datasetKey: 'sales_orders',
    targetField: 'total_amount',
    sourceObject: 'Pedidos',
    sourceFieldPath: 'ValorTotal',
    logicalField: 'sales.totalAmount',
    dataType: 'number',
    required: true,
    status: 'active',
    safeMetadata: {
      fieldRole: 'metric',
    },
    ...overrides,
  };
}

export function createConnection(
  overrides: Partial<RuntimeConnectionLike> = {},
): RuntimeConnectionLike {
  return {
    id: CONNECTION_ID,
    tenantId: TENANT_ID,
    type: 'database',
    sourceType: 'sql_server',
    status: 'active',
    credentialRef: CREDENTIAL_REF,
    authType: 'database_connection_string',
    safeMetadata: {
      region: 'br',
    },
    ...overrides,
  };
}

export function createCredential(
  overrides: Partial<RuntimeCredentialReferenceLike> = {},
): RuntimeCredentialReferenceLike {
  return {
    credentialRef: CREDENTIAL_REF,
    tenantId: TENANT_ID,
    status: 'active',
    provider: 'internal-fixture',
    safeMetadata: {
      provider: 'internal-fixture',
    },
    ...overrides,
  };
}

export function createCredentialProbe(): {
  readonly credential: RuntimeCredentialReferenceLike;
  readonly protectedSecretValueReads: () => number;
} {
  let reads = 0;
  const credential = createCredential();

  Object.defineProperty(credential, 'protectedSecretValue', {
    enumerable: true,
    get: () => {
      reads += 1;
      return 'must-not-leak';
    },
  });

  return {
    credential,
    protectedSecretValueReads: () => reads,
  };
}

export function expectSafeJson(value: unknown): void {
  const json = JSON.stringify(value).toLowerCase();

  [
    'secretvalue',
    'protectedsecretvalue',
    'password',
    'token',
    'authorization',
    'connectionstring',
    'rawpayload',
    'rawresponse',
    'must-not-leak',
  ].forEach((fragment) => {
    expect(json).not.toContain(fragment);
  });
}
