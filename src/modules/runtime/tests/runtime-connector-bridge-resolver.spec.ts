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
  RuntimeConnectorReferenceBundle,
  RuntimeConnectorReferenceBundleResult,
  RuntimeConnectorSafeMetadataBuilder,
  RuntimeExecutionRequestReaderPort,
  RuntimeReadinessEvaluatorPort,
  RuntimeReferenceResolverPort,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

describe('RuntimeConnectorBridgeResolver', () => {
  it('prepares query demo command as execute_query_preview demo', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.Demo,
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({
      executionRequestId: 'exec_req_001',
      tenantId: 'tenant_001',
      capability: 'execute_query_preview',
      mode: 'demo',
      queryDefinitionId: 'query_001',
    });
    expect(result.events).toEqual([
      expect.objectContaining({
        eventType: 'command_prepared',
        status: ExecutionRequestStatus.Accepted,
      }),
    ]);
  });

  it('prepares query future_runtime command as execute_query_preview preview', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.FutureRuntime,
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.command).toMatchObject({
      capability: 'execute_query_preview',
      mode: 'preview',
    });
  });

  it('prepares dashboard demo command as refresh_dashboard_data demo', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Dashboard,
        mode: ExecutionRequestMode.Demo,
      }),
      references: createReferences({
        queryDefinitionId: undefined,
        dashboardDefinitionId: 'dashboard_001',
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.command).toMatchObject({
      capability: 'refresh_dashboard_data',
      mode: 'demo',
      dashboardDefinitionId: 'dashboard_001',
    });
  });

  it('prepares report demo command as generate_report_preview demo', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        mode: ExecutionRequestMode.Demo,
      }),
      references: createReferences({
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.command).toMatchObject({
      capability: 'generate_report_preview',
      mode: 'demo',
      reportDefinitionId: 'report_001',
    });
  });

  it('preserves request identity, deterministic requestedAt, default limits, and source references', async () => {
    const harness = createHarness();

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.command).toMatchObject({
      tenantId: 'tenant_001',
      executionRequestId: 'exec_req_001',
      requestId: 'req_001',
      correlationId: 'corr_001',
      requestedAt: '2026-05-03T12:00:00.000Z',
      connectionId: 'conn_001',
      credentialRef: 'cred_001',
      sourceType: 'rest_api',
      maxRows: 100,
      timeoutMs: 5000,
      previewLimit: 20,
      schemaMappingVersion: 'mapping_v1',
      fieldMappingId: 'mapping_001',
    });
  });

  it('keeps safeParameters empty and does not leak secrets into command output', async () => {
    const harness = createHarness({
      references: createReferences({
        source: {
          sourceType: 'rest_api',
          sourceObject: '$.items[*]',
          connectionId: 'conn_001',
          credentialRef: 'cred_001',
          safeMetadata: {},
          metadata: {
            domain: 'sales',
            secretValue: 'must-not-leak',
            protectedSecretValue: 'must-not-leak',
            password: 'must-not-leak',
            connectionString: 'Server=example;Password=must-not-leak',
          },
        },
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.command?.safeParameters).toEqual({});
    expect(result.command?.metadata).toMatchObject({
      domain: 'sales',
      capability: 'execute_query_preview',
      sourceType: 'rest_api',
    });
    expect(JSON.stringify(result.command)).not.toContain('must-not-leak');
    expect(JSON.stringify(result.command)).not.toContain('connectionString');
  });

  it('blocks when execution request is not found', async () => {
    const harness = createHarness({ executionRequest: null });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      blockers: [],
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
  });

  it('blocks when reader returns a request from another tenant', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({ tenantId: 'tenant_other' }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'execution_request_tenant_mismatch',
        category: 'security',
      },
    });
    expect(result.events[0].safeMetadata).toMatchObject({
      tenantId: 'tenant_001',
    });
  });

  it('blocks when readiness returns blockers', async () => {
    const blockers = [
      {
        code: 'field_mappings_missing',
        message: 'No field mappings are configured.',
        target: 'dataset.fieldMappings',
      },
    ];
    const harness = createHarness({
      readiness: {
        checks: [],
        warnings: [],
        blockers,
      },
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      blockers,
      safeError: {
        code: 'readiness_blocked',
        category: 'readiness',
      },
    });
    expect(result.events[0]).toMatchObject({
      eventType: 'command_blocked',
      status: ExecutionRequestStatus.Blocked,
    });
  });

  it('blocks when reference resolver returns blockers', async () => {
    const blockers = [
      {
        code: 'credential_ref_missing',
        message: 'Connection has no credentialRef.',
        target: 'connection.credentialRef',
      },
    ];
    const harness = createHarness({
      referenceResult: {
        resolved: false,
        blockers,
      },
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      blockers,
      safeError: {
        code: 'references_blocked',
      },
    });
  });

  it('blocks unsupported capability mappings safely', async () => {
    const harness = createHarness({
      executionRequest: createExecutionRequest({ kind: 'unknown_kind' }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

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
  });

  it('blocks command validation failure for suspicious credentialRef', async () => {
    const harness = createHarness({
      references: createReferences({
        credentialRef: 'Bearer abcdefghijklmnopqrstuvwxyz',
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

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
  });

  it('blocks command validation failure for connection string in connectionId', async () => {
    const harness = createHarness({
      references: createReferences({
        connectionId: 'Server=example;Database=delfos;Password=must-not-leak',
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result).toMatchObject({
      prepared: false,
      safeError: {
        code: 'command_validation_failed',
        category: 'security',
      },
    });
    expect(JSON.stringify(result.safeError)).not.toContain('must-not-leak');
  });

  it('does not leak secrets into safe errors or bridge events', async () => {
    const harness = createHarness({
      referenceResult: {
        resolved: false,
        blockers: [
          {
            code: 'secret_token_missing',
            message: 'token=must-not-leak',
          },
        ],
      },
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(JSON.stringify(result.safeError)).not.toContain('must-not-leak');
    expect(JSON.stringify(result.events)).not.toContain('must-not-leak');
  });

  it.each([
    [
      'sql_server',
      {
        sourceObject: 'Pedidos',
        sourceFieldPath: 'ValorTotal',
      },
    ],
    [
      'rest_api',
      {
        sourceObject: '$.items[*]',
        sourceFieldPath: '$.items[*].amount',
      },
    ],
    [
      'mongodb',
      {
        sourceObject: 'orders',
        sourceFieldPath: 'items.amount',
      },
    ],
  ])('prepares source-agnostic command for %s references', async (sourceType, source) => {
    const harness = createHarness({
      references: createReferences({
        sourceType,
        source: {
          sourceType,
          sourceObject: source.sourceObject,
          connectionId: 'conn_001',
          credentialRef: 'cred_001',
          schemaMappingVersion: 'mapping_v1',
          safeMetadata: {},
          metadata: {
            sourceObject: source.sourceObject,
            sourceFieldPath: source.sourceFieldPath,
          },
        },
        fieldMappings: [
          {
            fieldMappingId: 'mapping_001',
            datasetId: 'dataset_001',
            datasetKey: 'sales_orders',
            targetField: 'total_amount',
            sourceObject: source.sourceObject,
            sourceFieldPath: source.sourceFieldPath,
            logicalField: 'sales.totalAmount',
            source,
            logical: {
              logicalField: 'sales.totalAmount',
              sourceFieldPath: source.sourceFieldPath,
              semanticRole: 'metric',
            },
            status: 'active',
          },
        ],
      }),
    });

    const result = await harness.resolver.prepareCommand(createInput());

    expect(result.prepared).toBe(true);
    expect(result.command).toMatchObject({ sourceType });
    expect(result.command).not.toHaveProperty('table');
    expect(result.command).not.toHaveProperty('column');
  });

  it('returns deterministic command and event for the same input and fakes', async () => {
    const firstHarness = createHarness();
    const secondHarness = createHarness();

    const firstResult = await firstHarness.resolver.prepareCommand(createInput());
    const secondResult = await secondHarness.resolver.prepareCommand(createInput());

    expect(firstResult).toEqual(secondResult);
  });
});

interface HarnessOptions {
  readonly executionRequest?: ExecutionRequestLike | null;
  readonly readiness?: BridgeReadinessResult;
  readonly references?: RuntimeConnectorReferenceBundle;
  readonly referenceResult?: RuntimeConnectorReferenceBundleResult;
}

function createHarness(options: HarnessOptions = {}) {
  const executionRequest =
    options.executionRequest === undefined ? createExecutionRequest() : options.executionRequest;
  const readiness = options.readiness ?? {
    checks: [{ code: 'query_definition_found', message: 'Query definition exists.' }],
    warnings: [],
    blockers: [],
  };
  const referenceResult = options.referenceResult ?? {
    resolved: true,
    references: options.references ?? createReferences(),
    blockers: [],
  };
  const executionRequestReader: RuntimeExecutionRequestReaderPort = {
    findByTenantAndId: jest.fn(async () => executionRequest),
  };
  const readinessEvaluator: RuntimeReadinessEvaluatorPort = {
    evaluate: jest.fn(async () => readiness),
  };
  const referenceResolver: RuntimeReferenceResolverPort = {
    resolveReferences: jest.fn(async () => referenceResult),
  };
  const clock: RuntimeClockPort = {
    now: jest.fn(() => new Date('2026-05-03T12:00:00.000Z')),
  };
  const dependencies: RuntimeConnectorBridgeResolverDependencies = {
    executionRequestReader,
    readinessEvaluator,
    referenceResolver,
    capabilityMapper: new RuntimeConnectorCapabilityMapper(),
    limitsPolicy: new RuntimeConnectorLimitsPolicy(),
    safeMetadataBuilder: new RuntimeConnectorSafeMetadataBuilder(),
    commandValidator: new RuntimeConnectorLocalCommandShapeValidator(),
    clock,
  };

  return {
    resolver: new RuntimeConnectorBridgeResolver(dependencies),
    executionRequestReader,
    readinessEvaluator,
    referenceResolver,
    clock,
  };
}

function createInput(
  overrides: Partial<PrepareRuntimeConnectorCommandInput> = {},
): PrepareRuntimeConnectorCommandInput {
  return {
    executionRequestId: 'exec_req_001',
    tenantId: 'tenant_001',
    actorId: 'actor_001',
    actorRole: 'operator',
    requestId: 'req_001',
    correlationId: 'corr_001',
    ...overrides,
  };
}

function createExecutionRequest(
  overrides: Partial<ExecutionRequestLike> = {},
): ExecutionRequestLike {
  return {
    id: 'exec_req_001',
    tenantId: 'tenant_001',
    kind: ExecutionRequestKind.Query,
    mode: ExecutionRequestMode.FutureRuntime,
    status: ExecutionRequestStatus.Accepted,
    requestKey: 'exec_req_001',
    queryDefinitionId: 'query_001',
    ...overrides,
  };
}

function createReferences(
  overrides: Partial<RuntimeConnectorReferenceBundle> = {},
): RuntimeConnectorReferenceBundle {
  return {
    executionRequestId: 'exec_req_001',
    tenantId: 'tenant_001',
    kind: ExecutionRequestKind.Query,
    mode: ExecutionRequestMode.FutureRuntime,
    rootReference: {
      kind: ExecutionRequestKind.Query,
      id: 'query_001',
    },
    connectionId: 'conn_001',
    credentialRef: 'cred_001',
    datasetId: 'dataset_001',
    fieldMappingIds: ['mapping_001'],
    queryDefinitionId: 'query_001',
    sourceType: 'rest_api',
    source: {
      sourceType: 'rest_api',
      sourceObject: '$.items[*]',
      connectionId: 'conn_001',
      credentialRef: 'cred_001',
      schemaMappingVersion: 'mapping_v1',
      safeMetadata: {
        domain: 'sales',
      },
      metadata: {
        domain: 'sales',
      },
    },
    fieldMappings: [
      {
        fieldMappingId: 'mapping_001',
        datasetId: 'dataset_001',
        datasetKey: 'sales_orders',
        targetField: 'total_amount',
        sourceObject: '$.items[*]',
        sourceFieldPath: '$.items[*].amount',
        logicalField: 'sales.totalAmount',
        source: {
          sourceObject: '$.items[*]',
          sourceFieldPath: '$.items[*].amount',
        },
        logical: {
          logicalField: 'sales.totalAmount',
          semanticRole: 'metric',
        },
        status: 'active',
      },
    ],
    logicalFields: [
      {
        logicalField: 'sales.totalAmount',
        semanticRole: 'metric',
        sourceFieldPath: '$.items[*].amount',
      },
    ],
    schemaMappingVersion: 'mapping_v1',
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}
