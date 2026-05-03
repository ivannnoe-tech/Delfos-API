import {
  ExecutionRequestLike,
  ResolveRuntimeConnectorReferencesInput,
  RuntimeConnectorReferenceResolver,
  RuntimeConnectorReferenceResolverDependencies,
  RuntimeConnectorSafeMetadataBuilder,
  RuntimeConnectionLike,
  RuntimeCredentialReferenceLike,
  RuntimeDashboardDefinitionLike,
  RuntimeDatasetLike,
  RuntimeFieldMappingLike,
  RuntimeQueryDefinitionLike,
  RuntimeReportDefinitionLike,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

describe('RuntimeConnectorReferenceResolver', () => {
  it('resolves query references through dataset, mappings, connection, credentialRef, and sourceType', async () => {
    const harness = createHarness();

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.resolved).toBe(true);
    expect(result.references).toMatchObject({
      executionRequestId: 'exec_req_001',
      tenantId: 'tenant_001',
      kind: ExecutionRequestKind.Query,
      mode: ExecutionRequestMode.FutureRuntime,
      rootReference: {
        kind: ExecutionRequestKind.Query,
        id: 'query_001',
      },
      queryDefinitionId: 'query_001',
      datasetId: 'dataset_001',
      connectionId: 'conn_001',
      credentialRef: 'cred_001',
      sourceType: 'rest_api',
      schemaMappingVersion: 'mapping_v1',
    });
    expect(result.references?.fieldMappings).toEqual([
      expect.objectContaining({
        fieldMappingId: 'mapping_001',
        targetField: 'total_amount',
        sourceObject: '$.items[*]',
        sourceFieldPath: 'amount',
        logicalField: 'sales.totalAmount',
      }),
    ]);
  });

  it('blocks query without dataset reference', async () => {
    const harness = createHarness({
      queries: [createQuery({ datasetId: undefined })],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result).toMatchObject({
      resolved: false,
      blockers: [
        {
          code: 'dataset_missing',
        },
      ],
    });
  });

  it('blocks query when dataset has no datasetKey', async () => {
    const harness = createHarness({
      datasets: [createDataset({ datasetKey: undefined })],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'dataset_key_missing',
      }),
    ]);
  });

  it('blocks query when field mappings are missing', async () => {
    const harness = createHarness({ mappings: [] });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'field_mappings_missing',
      }),
    ]);
  });

  it('blocks query when connection is missing', async () => {
    const harness = createHarness({ connections: [] });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'connection_missing',
      }),
    ]);
  });

  it('blocks query when credentialRef is missing for a credentialed source', async () => {
    const harness = createHarness({
      connections: [createConnection({ credentialRef: undefined, authType: 'bearer_token' })],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'credential_ref_missing',
      }),
    ]);
  });

  it('preserves tenantId and does not include secret values in query result', async () => {
    const harness = createHarness({
      datasets: [
        createDataset({
          safeMetadata: {
            domain: 'sales',
            protectedSecretValue: 'must-not-leak',
          },
        }),
      ],
      connections: [
        createConnection({
          safeMetadata: {
            password: 'must-not-leak',
            region: 'br',
          },
        }),
      ],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.references?.tenantId).toBe('tenant_001');
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(result.references?.safeMetadata).toMatchObject({
      domain: 'sales',
      region: 'br',
    });
  });

  it('resolves dashboard with one widget query', async () => {
    const harness = createHarness();
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Dashboard,
        queryDefinitionId: undefined,
        dashboardDefinitionId: 'dashboard_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result).toMatchObject({
      resolved: true,
      references: {
        rootReference: {
          kind: ExecutionRequestKind.Dashboard,
          id: 'dashboard_001',
        },
        dashboardDefinitionId: 'dashboard_001',
        queryDefinitionId: 'query_001',
      },
    });
  });

  it('blocks dashboard without widgets with queryDefinitionId', async () => {
    const harness = createHarness({
      dashboards: [createDashboard({ widgets: [{ key: 'text_001', type: 'text' }] })],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Dashboard,
        queryDefinitionId: undefined,
        dashboardDefinitionId: 'dashboard_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'query_definition_missing',
      }),
    ]);
  });

  it('blocks dashboard when widget query belongs to another tenant', async () => {
    const harness = createHarness({
      queries: [createQuery({ tenantId: 'tenant_other' })],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Dashboard,
        queryDefinitionId: undefined,
        dashboardDefinitionId: 'dashboard_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'query_definition_missing',
      }),
    ]);
  });

  it('blocks dashboard with multiple different sources', async () => {
    const harness = createHarness({
      queries: [
        createQuery({ id: 'query_001', datasetId: 'dataset_001' }),
        createQuery({ id: 'query_002', datasetId: 'dataset_002', queryKey: 'inventory' }),
      ],
      dashboards: [
        createDashboard({
          widgets: [
            { key: 'sales', queryDefinitionId: 'query_001', type: 'metric_card' },
            { key: 'inventory', queryDefinitionId: 'query_002', type: 'metric_card' },
          ],
        }),
      ],
      datasets: [
        createDataset({ id: 'dataset_001', connectionId: 'conn_001', sourceType: 'rest_api' }),
        createDataset({
          id: 'dataset_002',
          connectionId: 'conn_002',
          datasetKey: 'inventory',
          sourceType: 'mongodb',
        }),
      ],
      mappings: [
        createMapping({ datasetKey: 'sales_orders', id: 'mapping_001' }),
        createMapping({
          datasetKey: 'inventory',
          id: 'mapping_002',
          sourceObject: 'items',
          sourceFieldPath: 'stock',
          targetField: 'stock',
        }),
      ],
      connections: [
        createConnection({ id: 'conn_001', sourceType: 'rest_api', credentialRef: 'cred_001' }),
        createConnection({ id: 'conn_002', sourceType: 'mongodb', credentialRef: 'cred_002' }),
      ],
      credentials: [createCredential(), createCredential({ credentialRef: 'cred_002' })],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Dashboard,
        queryDefinitionId: undefined,
        dashboardDefinitionId: 'dashboard_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'multiple_sources_not_supported',
      }),
    ]);
  });

  it('resolves report with queryDefinitionId', async () => {
    const harness = createHarness();
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result).toMatchObject({
      resolved: true,
      references: {
        reportDefinitionId: 'report_001',
        queryDefinitionId: 'query_001',
      },
    });
  });

  it('resolves report with dashboardDefinitionId', async () => {
    const harness = createHarness({
      reports: [
        createReport({
          queryDefinitionId: undefined,
          dashboardDefinitionId: 'dashboard_001',
        }),
      ],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result).toMatchObject({
      resolved: true,
      references: {
        dashboardDefinitionId: 'dashboard_001',
        reportDefinitionId: 'report_001',
      },
    });
  });

  it('resolves report blocks with query and dashboard references', async () => {
    const harness = createHarness({
      reports: [
        createReport({
          queryDefinitionId: undefined,
          blocks: [
            { key: 'query_block', queryDefinitionId: 'query_001', type: 'table' },
            {
              key: 'dashboard_block',
              dashboardDefinitionId: 'dashboard_001',
              type: 'dashboard_widget',
            },
          ],
        }),
      ],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.resolved).toBe(true);
    expect(result.references?.fieldMappings).toHaveLength(1);
  });

  it('blocks report without resolvable references', async () => {
    const harness = createHarness({
      reports: [createReport({ queryDefinitionId: undefined, blocks: [] })],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'report_definition_missing',
      }),
    ]);
  });

  it('blocks report with multiple different sources', async () => {
    const harness = createHarness({
      queries: [
        createQuery({ id: 'query_001', datasetId: 'dataset_001' }),
        createQuery({ id: 'query_002', datasetId: 'dataset_002', queryKey: 'inventory' }),
      ],
      reports: [
        createReport({
          queryDefinitionId: undefined,
          blocks: [
            { key: 'sales', queryDefinitionId: 'query_001', type: 'table' },
            { key: 'inventory', queryDefinitionId: 'query_002', type: 'table' },
          ],
        }),
      ],
      datasets: [
        createDataset({ id: 'dataset_001', connectionId: 'conn_001', sourceType: 'rest_api' }),
        createDataset({
          id: 'dataset_002',
          connectionId: 'conn_002',
          datasetKey: 'inventory',
          sourceType: 'mongodb',
        }),
      ],
      mappings: [
        createMapping({ datasetKey: 'sales_orders', id: 'mapping_001' }),
        createMapping({
          datasetKey: 'inventory',
          id: 'mapping_002',
          sourceObject: 'orders',
          sourceFieldPath: 'items.amount',
        }),
      ],
      connections: [
        createConnection({ id: 'conn_001', sourceType: 'rest_api', credentialRef: 'cred_001' }),
        createConnection({ id: 'conn_002', sourceType: 'mongodb', credentialRef: 'cred_002' }),
      ],
      credentials: [createCredential(), createCredential({ credentialRef: 'cred_002' })],
    });
    const input = createInput({
      executionRequest: createExecutionRequest({
        kind: ExecutionRequestKind.Report,
        queryDefinitionId: undefined,
        reportDefinitionId: 'report_001',
      }),
    });

    const result = await harness.resolver.resolveReferences(input);

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'multiple_sources_not_supported',
      }),
    ]);
  });

  it('sanitizes unsafe metadata from dataset, connection, and mapping', async () => {
    const harness = createHarness({
      datasets: [
        createDataset({
          safeMetadata: {
            datasetDomain: 'sales',
            secretValue: 'must-not-leak',
          },
        }),
      ],
      connections: [
        createConnection({
          safeMetadata: {
            connectionRegion: 'br',
            connectionString: 'Server=example;Password=must-not-leak',
          },
        }),
      ],
      mappings: [
        createMapping({
          safeMetadata: {
            mappingDomain: 'sales',
            token: 'must-not-leak',
          },
        }),
      ],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(result.references?.safeMetadata).toMatchObject({
      datasetDomain: 'sales',
      connectionRegion: 'br',
    });
    expect(result.references?.fieldMappings[0]?.safeMetadata).toEqual({
      mappingDomain: 'sales',
    });
  });

  it('preserves safe sourceFieldPath without treating it as free SQL', async () => {
    const harness = createHarness({
      mappings: [
        createMapping({
          sourceObject: 'Pedidos',
          sourceFieldPath: 'ValorTotal',
        }),
      ],
      datasets: [createDataset({ sourceType: 'sql_server' })],
      connections: [createConnection({ sourceType: 'sql_server' })],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.references?.fieldMappings[0]).toMatchObject({
      sourceObject: 'Pedidos',
      sourceFieldPath: 'ValorTotal',
    });
    expect(result.references?.fieldMappings[0]).not.toHaveProperty('sql');
  });

  it('blocks suspicious credentialRef safely', async () => {
    const harness = createHarness({
      connections: [createConnection({ credentialRef: 'Bearer abcdefghijklmnopqrstuvwxyz' })],
    });

    const result = await harness.resolver.resolveReferences(createInput());

    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: 'credential_ref_missing',
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain('abcdefghijklmnopqrstuvwxyz');
  });

  it.each([
    ['sql_server', 'Pedidos', 'ValorTotal'],
    ['rest_api', '$.items[*]', 'amount'],
    ['mongodb', 'orders', 'items.amount'],
    ['file', 'sheet:Vendas', 'Valor Total'],
  ])(
    'resolves source-agnostic %s mappings with sourceObject/sourceFieldPath',
    async (sourceType, sourceObject, sourceFieldPath) => {
      const harness = createHarness({
        datasets: [createDataset({ sourceType })],
        connections: [createConnection({ sourceType })],
        mappings: [createMapping({ sourceObject, sourceFieldPath })],
      });

      const result = await harness.resolver.resolveReferences(createInput());

      expect(result.references?.sourceDescriptor).toMatchObject({
        sourceType,
        sourceObject,
        sourceFieldPath,
      });
      expect(result.references?.fieldMappings[0]).toMatchObject({
        sourceObject,
        sourceFieldPath,
      });
      expect(result.references?.fieldMappings[0]).not.toHaveProperty('table');
      expect(result.references?.fieldMappings[0]).not.toHaveProperty('column');
    },
  );

  it('returns deterministic bundle for the same input and fakes', async () => {
    const firstHarness = createHarness();
    const secondHarness = createHarness();

    const first = await firstHarness.resolver.resolveReferences(createInput());
    const second = await secondHarness.resolver.resolveReferences(createInput());

    expect(first).toEqual(second);
  });
});

interface HarnessOptions {
  readonly queries?: readonly RuntimeQueryDefinitionLike[];
  readonly dashboards?: readonly RuntimeDashboardDefinitionLike[];
  readonly reports?: readonly RuntimeReportDefinitionLike[];
  readonly datasets?: readonly RuntimeDatasetLike[];
  readonly mappings?: readonly RuntimeFieldMappingLike[];
  readonly connections?: readonly RuntimeConnectionLike[];
  readonly credentials?: readonly RuntimeCredentialReferenceLike[];
}

function createHarness(options: HarnessOptions = {}) {
  const queries = options.queries ?? [createQuery()];
  const dashboards = options.dashboards ?? [createDashboard()];
  const reports = options.reports ?? [createReport()];
  const datasets = options.datasets ?? [createDataset()];
  const mappings = options.mappings ?? [createMapping()];
  const connections = options.connections ?? [createConnection()];
  const credentials = options.credentials ?? [createCredential()];
  const dependencies: RuntimeConnectorReferenceResolverDependencies = {
    queryDefinitionReader: {
      findByTenantAndId: jest.fn(async (_tenantId, id) => findById(queries, id)),
    },
    dashboardDefinitionReader: {
      findByTenantAndId: jest.fn(async (_tenantId, id) => findById(dashboards, id)),
    },
    reportDefinitionReader: {
      findByTenantAndId: jest.fn(async (_tenantId, id) => findById(reports, id)),
    },
    datasetReader: {
      findByTenantAndId: jest.fn(async (_tenantId, id) => findById(datasets, id)),
    },
    fieldMappingReader: {
      findByTenantAndDatasetKey: jest.fn(async (_tenantId, datasetKey) =>
        mappings.filter((mapping) => mapping.datasetKey === datasetKey),
      ),
    },
    connectionReader: {
      findByTenantAndId: jest.fn(async (_tenantId, id) => findById(connections, id)),
    },
    credentialReferenceReader: {
      findByTenantAndCredentialRef: jest.fn(
        async (_tenantId, credentialRef) =>
          credentials.find((credential) => credential.credentialRef === credentialRef) ?? null,
      ),
    },
    safeMetadataBuilder: new RuntimeConnectorSafeMetadataBuilder(),
  };

  return {
    resolver: new RuntimeConnectorReferenceResolver(dependencies),
    dependencies,
  };
}

function findById<T extends { readonly id: string }>(items: readonly T[], id: string): T | null {
  return items.find((item) => item.id === id) ?? null;
}

function createInput(
  overrides: Partial<ResolveRuntimeConnectorReferencesInput> = {},
): ResolveRuntimeConnectorReferencesInput {
  return {
    tenantId: 'tenant_001',
    executionRequest: createExecutionRequest(),
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

function createQuery(
  overrides: Partial<RuntimeQueryDefinitionLike> = {},
): RuntimeQueryDefinitionLike {
  return {
    id: 'query_001',
    tenantId: 'tenant_001',
    datasetId: 'dataset_001',
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
    id: 'dashboard_001',
    tenantId: 'tenant_001',
    dashboardKey: 'sales_dashboard',
    widgets: [{ key: 'total_sales', queryDefinitionId: 'query_001', type: 'metric_card' }],
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
    id: 'report_001',
    tenantId: 'tenant_001',
    reportKey: 'sales_report',
    queryDefinitionId: 'query_001',
    blocks: [],
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

function createDataset(overrides: Partial<RuntimeDatasetLike> = {}): RuntimeDatasetLike {
  return {
    id: 'dataset_001',
    tenantId: 'tenant_001',
    datasetKey: 'sales_orders',
    connectionId: 'conn_001',
    sourceType: 'rest_api',
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
    id: 'mapping_001',
    tenantId: 'tenant_001',
    datasetKey: 'sales_orders',
    targetField: 'total_amount',
    sourceObject: '$.items[*]',
    sourceFieldPath: 'amount',
    logicalField: 'sales.totalAmount',
    dataType: 'number',
    required: true,
    status: 'active',
    safeMetadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}

function createConnection(overrides: Partial<RuntimeConnectionLike> = {}): RuntimeConnectionLike {
  return {
    id: 'conn_001',
    tenantId: 'tenant_001',
    type: 'customer_api',
    sourceType: 'rest_api',
    status: 'active',
    credentialRef: 'cred_001',
    authType: 'api_key_header',
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
    credentialRef: 'cred_001',
    tenantId: 'tenant_001',
    status: 'active',
    provider: 'customer-api',
    safeMetadata: {
      provider: 'customer-api',
    },
    ...overrides,
  };
}
