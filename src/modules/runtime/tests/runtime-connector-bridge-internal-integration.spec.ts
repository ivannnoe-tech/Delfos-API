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

const TENANT_ID = '662d4f6e7a1c2b00124f0001';
const OTHER_TENANT_ID = '662d4f6e7a1c2b00124f0002';
const EXECUTION_REQUEST_ID = '662d4f6e7a1c2b00124f0901';
const QUERY_DEFINITION_ID = '662d4f6e7a1c2b00124f0601';
const DASHBOARD_DEFINITION_ID = '662d4f6e7a1c2b00124f0701';
const REPORT_DEFINITION_ID = '662d4f6e7a1c2b00124f0801';
const DATASET_ID = '662d4f6e7a1c2b00124f0501';
const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';
const CREDENTIAL_REF = 'cred_662d4f6e7a1c2b00124f0401';
const FIELD_MAPPING_ID = '662d4f6e7a1c2b00124f0511';
const REQUESTED_AT = '2026-05-03T12:00:00.000Z';

describe('RuntimeConnectorBridgeResolver internal integration', () => {
  it('prepares query demo command through the real reference resolver', async () => {
    const harness = createHarness({
      executionRequests: [
        createExecutionRequest({
          kind: ExecutionRequestKind.Query,
          mode: ExecutionRequestMode.Demo,
        }),
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({
      capability: 'execute_query_preview',
      mode: 'demo',
      tenantId: TENANT_ID,
      executionRequestId: EXECUTION_REQUEST_ID,
      requestId: 'req_bridge_001',
      correlationId: 'corr_bridge_001',
      requestedAt: REQUESTED_AT,
      timeoutMs: 5000,
      maxRows: 100,
      previewLimit: 20,
      connectionId: CONNECTION_ID,
      credentialRef: CREDENTIAL_REF,
      sourceType: 'sql_server',
      queryDefinitionId: QUERY_DEFINITION_ID,
      datasetId: DATASET_ID,
      fieldMappingId: FIELD_MAPPING_ID,
    });
    expect(result.events).toEqual([
      expect.objectContaining({
        eventType: 'command_prepared',
        status: ExecutionRequestStatus.Accepted,
      }),
    ]);
    expect(result.events[0]?.safeMetadata).toMatchObject({
      capability: 'execute_query_preview',
      mode: 'demo',
      sourceType: 'sql_server',
    });
    expectSafeJson(result);
  });

  it('prepares query future_runtime as preview without dispatch', async () => {
    const harness = createHarness();

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({
      capability: 'execute_query_preview',
      mode: 'preview',
    });
    expect(harness.dependencies).not.toHaveProperty('dispatchPort');
  });

  it('prepares dashboard demo with one resolved source', async () => {
    const harness = createHarness({
      executionRequests: [
        createExecutionRequest({
          kind: ExecutionRequestKind.Dashboard,
          mode: ExecutionRequestMode.Demo,
          queryDefinitionId: undefined,
          dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
        }),
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({
      capability: 'refresh_dashboard_data',
      mode: 'demo',
      dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
      queryDefinitionId: QUERY_DEFINITION_ID,
      connectionId: CONNECTION_ID,
      credentialRef: CREDENTIAL_REF,
      sourceType: 'sql_server',
    });
    expectSafeJson(result);
  });

  it('prepares report demo with resolved query references', async () => {
    const harness = createHarness({
      executionRequests: [
        createExecutionRequest({
          kind: ExecutionRequestKind.Report,
          mode: ExecutionRequestMode.Demo,
          queryDefinitionId: undefined,
          reportDefinitionId: REPORT_DEFINITION_ID,
        }),
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({
      capability: 'generate_report_preview',
      mode: 'demo',
      reportDefinitionId: REPORT_DEFINITION_ID,
      queryDefinitionId: QUERY_DEFINITION_ID,
      connectionId: CONNECTION_ID,
      credentialRef: CREDENTIAL_REF,
      sourceType: 'sql_server',
    });
    expectSafeJson(result);
  });

  it('blocks safely when execution request is not found', async () => {
    const harness = createHarness({ executionRequests: [] });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'execution_request_not_found',
        category: 'validation',
      },
      events: [
        {
          eventType: 'command_blocked',
          status: ExecutionRequestStatus.Blocked,
        },
      ],
    });
    expect(result.command).toBeUndefined();
    expectSafeJson(result);
  });

  it('blocks safely when a reader returns a request from another tenant', async () => {
    const harness = createHarness({
      executionRequests: [createExecutionRequest({ tenantId: OTHER_TENANT_ID })],
      executionRequestReaderTenantScoped: false,
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'execution_request_tenant_mismatch',
        category: 'security',
      },
    });
    expect(result.command).toBeUndefined();
    expectSafeJson(result);
  });

  it('blocks readiness blockers before reference resolution', async () => {
    const readiness: BridgeReadinessResult = {
      checks: [{ code: 'execution_request_found', message: 'Request exists.' }],
      warnings: [],
      blockers: [
        {
          code: 'dataset_not_ready',
          message: 'Dataset readiness is incomplete.',
          target: 'dataset',
        },
      ],
    };
    const harness = createHarness({ readiness });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      blockers: readiness.blockers,
      safeError: {
        code: 'readiness_blocked',
        category: 'readiness',
      },
      events: [
        {
          eventType: 'command_blocked',
          status: ExecutionRequestStatus.Blocked,
        },
      ],
    });
    expect(result.command).toBeUndefined();
    expect(harness.queryDefinitionFindByTenantAndId).not.toHaveBeenCalled();
    expectSafeJson(result);
  });

  it.each([
    [
      'dataset without mappings',
      {
        mappings: [],
        expectedCode: 'field_mappings_missing',
      },
    ],
    [
      'missing connection',
      {
        connections: [],
        expectedCode: 'connection_missing',
      },
    ],
    [
      'missing credentialRef',
      {
        connections: [
          createConnection({
            credentialRef: undefined,
            authType: 'api_key_header',
          }),
        ],
        expectedCode: 'credential_ref_missing',
      },
    ],
  ])('blocks reference blockers for %s', async (_caseName, options) => {
    const harness = createHarness(options);

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'references_blocked',
      },
      events: [
        {
          eventType: 'command_blocked',
          status: ExecutionRequestStatus.Blocked,
        },
      ],
    });
    expect(result.command).toBeUndefined();
    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: options.expectedCode,
      }),
    ]);
    expectSafeJson(result);
  });

  it.each([
    [
      ExecutionRequestKind.Dashboard,
      {
        queryDefinitionId: undefined,
        dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
      },
    ],
    [
      ExecutionRequestKind.Report,
      {
        queryDefinitionId: undefined,
        reportDefinitionId: REPORT_DEFINITION_ID,
      },
    ],
  ])('blocks %s requests with multiple source references', async (kind, refs) => {
    const secondaryQueryId = '662d4f6e7a1c2b00124f0602';
    const secondaryDatasetId = '662d4f6e7a1c2b00124f0502';
    const secondaryConnectionId = '662d4f6e7a1c2b00124f0202';
    const harness = createHarness({
      executionRequests: [
        createExecutionRequest({
          kind,
          mode: ExecutionRequestMode.Demo,
          ...refs,
        }),
      ],
      queries: [
        createQuery(),
        createQuery({
          id: secondaryQueryId,
          datasetId: secondaryDatasetId,
          queryKey: 'inventory_stock',
        }),
      ],
      dashboards: [
        createDashboard({
          widgets: [
            { key: 'sales', queryDefinitionId: QUERY_DEFINITION_ID, type: 'metric_card' },
            { key: 'inventory', queryDefinitionId: secondaryQueryId, type: 'metric_card' },
          ],
        }),
      ],
      reports: [
        createReport({
          queryDefinitionId: undefined,
          blocks: [
            { key: 'sales', queryDefinitionId: QUERY_DEFINITION_ID, type: 'table' },
            { key: 'inventory', queryDefinitionId: secondaryQueryId, type: 'table' },
          ],
        }),
      ],
      datasets: [
        createDataset(),
        createDataset({
          id: secondaryDatasetId,
          datasetKey: 'inventory_items',
          connectionId: secondaryConnectionId,
          sourceType: 'mongodb',
        }),
      ],
      mappings: [
        createMapping(),
        createMapping({
          id: '662d4f6e7a1c2b00124f0512',
          datasetKey: 'inventory_items',
          sourceObject: 'items',
          sourceFieldPath: 'stock',
          logicalField: 'inventory.stock',
          targetField: 'stock',
        }),
      ],
      connections: [
        createConnection(),
        createConnection({
          id: secondaryConnectionId,
          sourceType: 'mongodb',
          credentialRef: 'cred_662d4f6e7a1c2b00124f0402',
        }),
      ],
      credentials: [
        createCredential(),
        createCredential({
          credentialRef: 'cred_662d4f6e7a1c2b00124f0402',
        }),
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(false);
    expect(result.command).toBeUndefined();
    expect(result.safeError?.code).toBe('references_blocked');
    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'multiple_sources_not_supported',
      }),
    ]);
    expectSafeJson(result);
  });

  it('returns command_not_supported for unsupported kind/mode mapping after references resolve', async () => {
    const harness = createHarness({
      executionRequests: [
        createExecutionRequest({
          mode: 'execute',
        }),
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'capability_not_supported',
        category: 'not_supported',
      },
      events: [
        {
          eventType: 'command_not_supported',
          status: ExecutionRequestStatus.NotSupported,
        },
      ],
    });
    expect(result.command).toBeUndefined();
    expectSafeJson(result);
  });

  it('blocks validation failure for a suspicious credentialRef returned by credential reader', async () => {
    const harness = createHarness({
      credentials: [
        {
          ...createCredential({
            credentialRef: 'Bearer abcdefghijklmnopqrstuvwxyz',
          }),
          lookupCredentialRef: CREDENTIAL_REF,
        } as RuntimeCredentialReferenceLike & { readonly lookupCredentialRef: string },
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'command_validation_failed',
        category: 'security',
      },
      events: [
        {
          eventType: 'command_validation_failed',
          status: ExecutionRequestStatus.Failed,
        },
      ],
    });
    expect(result.command).toBeUndefined();
    expectSafeJson(result);
    expect(JSON.stringify(result)).not.toContain('abcdefghijklmnopqrstuvwxyz');
  });

  it('blocks validation failure for a connection object id that looks like a connection string', async () => {
    const harness = createHarness({
      connections: [
        {
          ...createConnection({
            id: 'Server=example.invalid;Database=delfos;Password=must-not-leak',
          }),
          lookupConnectionId: CONNECTION_ID,
        } as RuntimeConnectionLike & { readonly lookupConnectionId: string },
      ],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'command_validation_failed',
        category: 'security',
      },
    });
    expect(result.command).toBeUndefined();
    expectSafeJson(result);
  });

  it('sanitizes unsafe metadata from command, event, and safe error outputs', async () => {
    const credentialProbe = createCredentialProbe();
    const harness = createHarness({
      datasets: [
        createDataset({
          safeMetadata: {
            domain: 'sales',
            secretValue: 'must-not-leak',
            rawPayload: 'must-not-leak',
          },
        }),
      ],
      mappings: [
        createMapping({
          safeMetadata: {
            mappingDomain: 'sales',
            token: 'must-not-leak',
            rawResponse: 'must-not-leak',
          },
        }),
      ],
      connections: [
        createConnection({
          safeMetadata: {
            region: 'br',
            password: 'must-not-leak',
            authorization: 'Bearer must-not-leak',
            connectionString: 'Server=example.invalid;Password=must-not-leak',
          },
        }),
      ],
      credentials: [credentialProbe.credential],
    });

    const result = await harness.bridgeResolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command?.credentialRef).toBe(CREDENTIAL_REF);
    expect(result.command?.metadata).toMatchObject({
      domain: 'sales',
      region: 'br',
      capability: 'execute_query_preview',
      sourceType: 'sql_server',
    });
    expect(result.events[0]?.safeMetadata).not.toHaveProperty('password');
    expect(result.safeError?.safeMetadata).toBeUndefined();
    expect(credentialProbe.protectedSecretValueReads()).toBe(0);
    expectSafeJson(result);
  });

  it.each([
    ['rest_api', '$.items[*]', 'amount', 'sales.totalAmount'],
    ['mongodb', 'orders', 'items.amount', 'sales.totalAmount'],
    ['file', 'sheet:Vendas', 'Valor Total', 'sales.totalAmount'],
    ['sql_server', 'Pedidos', 'ValorTotal', 'sales.totalAmount'],
  ])(
    'prepares source-agnostic command for %s without table or column assumptions',
    async (sourceType, sourceObject, sourceFieldPath, logicalField) => {
      const harness = createHarness({
        datasets: [createDataset({ sourceType })],
        connections: [createConnection({ sourceType })],
        mappings: [
          createMapping({
            sourceObject,
            sourceFieldPath,
            logicalField,
            safeMetadata: {
              logicalField,
              sourceObject,
              sourceFieldPath,
            },
          }),
        ],
      });

      const result = await harness.bridgeResolver.prepareCommand(createInput());

      expect(result.prepared).toBe(true);
      expect(result.command).toMatchObject({
        sourceType,
        datasetId: DATASET_ID,
        fieldMappingId: FIELD_MAPPING_ID,
      });
      expect(result.command).not.toHaveProperty('table');
      expect(result.command).not.toHaveProperty('column');
      expect(result.command).not.toHaveProperty('sql');
      expect(JSON.stringify(result.command)).not.toContain('SELECT ');
      expectSafeJson(result);
    },
  );

  it('returns deterministic command and events for identical inputs, fakes, and clock', async () => {
    const firstHarness = createHarness();
    const secondHarness = createHarness();

    const first = await firstHarness.bridgeResolver.prepareCommand(createInput());
    const second = await secondHarness.bridgeResolver.prepareCommand(createInput());

    expect(first.command).toEqual(second.command);
    expect(first.events).toEqual(second.events);
  });

  it('documents that prepareCommand has no dispatch dependency in this phase', async () => {
    const harness = createHarness();

    await expect(harness.bridgeResolver.prepareCommand(createInput())).resolves.toMatchObject({
      prepared: true,
    });
    expect(Object.keys(harness.dependencies)).toEqual([
      'executionRequestReader',
      'readinessEvaluator',
      'referenceResolver',
      'capabilityMapper',
      'limitsPolicy',
      'safeMetadataBuilder',
      'commandValidator',
      'clock',
    ]);
    expect(Object.keys(harness.dependencies)).not.toContain('dispatch');
    expect(Object.keys(harness.dependencies)).not.toContain('dispatchPort');
  });
});

interface HarnessOptions {
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

function createHarness(options: HarnessOptions = {}) {
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

function findByTenantAndId<T extends { readonly id: string; readonly tenantId: string }>(
  items: readonly T[],
  tenantId: string,
  id: string,
): T | null {
  return items.find((item) => item.tenantId === tenantId && item.id === id) ?? null;
}

function readyReadiness(): BridgeReadinessResult {
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

function createInput(
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

function createExecutionRequest(
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

function createQuery(
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

function createDashboard(
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

function createReport(
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

function createDataset(overrides: Partial<RuntimeDatasetLike> = {}): RuntimeDatasetLike {
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

function createMapping(overrides: Partial<RuntimeFieldMappingLike> = {}): RuntimeFieldMappingLike {
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

function createConnection(overrides: Partial<RuntimeConnectionLike> = {}): RuntimeConnectionLike {
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

function createCredential(
  overrides: Partial<RuntimeCredentialReferenceLike> = {},
): RuntimeCredentialReferenceLike {
  return {
    credentialRef: CREDENTIAL_REF,
    tenantId: TENANT_ID,
    status: 'active',
    provider: 'internal-fixture',
    maskedPreview: '********demo',
    safeMetadata: {
      provider: 'internal-fixture',
    },
    ...overrides,
  };
}

function createCredentialProbe(): {
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

function expectSafeJson(value: unknown): void {
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
