/**
 * Runtime connector bridge internal integration — prepared commands. Covers
 * the cases where prepareCommand succeeds and produces a safe command. The
 * blocked/unsupported cases live in
 * `runtime-connector-bridge-internal-blocking.spec.ts`; the shared harness
 * lives in `runtime-connector-bridge-internal-integration.fixtures.ts`.
 */
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import {
  CONNECTION_ID,
  CREDENTIAL_REF,
  DASHBOARD_DEFINITION_ID,
  DATASET_ID,
  EXECUTION_REQUEST_ID,
  FIELD_MAPPING_ID,
  QUERY_DEFINITION_ID,
  REPORT_DEFINITION_ID,
  REQUESTED_AT,
  TENANT_ID,
  createConnection,
  createCredentialProbe,
  createDataset,
  createExecutionRequest,
  createHarness,
  createInput,
  createMapping,
  expectSafeJson,
} from './runtime-connector-bridge-internal-integration.fixtures';

describe('RuntimeConnectorBridgeResolver internal integration - prepared commands', () => {
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
