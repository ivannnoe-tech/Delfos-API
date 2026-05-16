/**
 * Runtime connector bridge internal integration — blocked and unsupported
 * commands. Covers the cases where prepareCommand safely refuses to produce a
 * command. The prepared/success cases live in
 * `runtime-connector-bridge-internal-integration.spec.ts`; the shared harness
 * lives in `runtime-connector-bridge-internal-integration.fixtures.ts`.
 */
import {
  BridgeReadinessResult,
  RuntimeConnectionLike,
  RuntimeCredentialReferenceLike,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import {
  CONNECTION_ID,
  CREDENTIAL_REF,
  DASHBOARD_DEFINITION_ID,
  OTHER_TENANT_ID,
  QUERY_DEFINITION_ID,
  REPORT_DEFINITION_ID,
  createConnection,
  createCredential,
  createDashboard,
  createDataset,
  createExecutionRequest,
  createHarness,
  createInput,
  createMapping,
  createQuery,
  createReport,
  expectSafeJson,
} from './runtime-connector-bridge-internal-integration.fixtures';

describe('RuntimeConnectorBridgeResolver internal integration - blocked commands', () => {
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
});
