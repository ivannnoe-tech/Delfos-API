import {
  RuntimeConnectionReaderAdapter,
  RuntimeConnectionReaderAdapterSource,
  RuntimeConnectorReferenceResolver,
  RuntimeConnectorReferenceResolverDependencies,
  RuntimeConnectorSafeMetadataBuilder,
  RuntimeCredentialReferenceReaderAdapter,
  RuntimeCredentialReferenceReaderAdapterSource,
  RuntimeDashboardDefinitionReaderAdapter,
  RuntimeDashboardDefinitionReaderAdapterSource,
  RuntimeDatasetReaderAdapter,
  RuntimeDatasetReaderAdapterSource,
  RuntimeFieldMappingReaderAdapter,
  RuntimeFieldMappingReaderAdapterSource,
  RuntimeQueryDefinitionReaderAdapter,
  RuntimeQueryDefinitionReaderAdapterSource,
  RuntimeReportDefinitionReaderAdapter,
  RuntimeReportDefinitionReaderAdapterSource,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

const TENANT_ID = '662d4f6e7a1c2b00124f0001';
const OTHER_TENANT_ID = '662d4f6e7a1c2b00124f0002';
const QUERY_DEFINITION_ID = '662d4f6e7a1c2b00124f0601';
const DASHBOARD_DEFINITION_ID = '662d4f6e7a1c2b00124f0701';
const REPORT_DEFINITION_ID = '662d4f6e7a1c2b00124f0801';
const DATASET_ID = '662d4f6e7a1c2b00124f0501';
const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';
const CREDENTIAL_ID = '662d4f6e7a1c2b00124f0401';
const CREDENTIAL_REF = `cred_${CREDENTIAL_ID}`;
const FIELD_MAPPING_ID = '662d4f6e7a1c2b00124f0511';

describe('Runtime reference reader adapters', () => {
  describe('RuntimeQueryDefinitionReaderAdapter', () => {
    it('returns a minimal query definition shape', async () => {
      const findOne = jest.fn(async () => createQueryDefinitionSource());
      const adapter = new RuntimeQueryDefinitionReaderAdapter({ findOne });

      const result = await adapter.findByTenantAndId(TENANT_ID, QUERY_DEFINITION_ID);

      expect(result).toEqual({
        id: QUERY_DEFINITION_ID,
        tenantId: TENANT_ID,
        datasetId: DATASET_ID,
        queryKey: 'sales_overview',
        status: 'active',
        type: 'metric',
        safeMetadata: {
          domain: 'sales',
          status: 'active',
          type: 'metric',
        },
      });
      expect(result).not.toHaveProperty('metrics');
      expect(result).not.toHaveProperty('settings');
    });

    it('returns null for another tenant, null result, or internal reader errors', async () => {
      const otherTenantAdapter = new RuntimeQueryDefinitionReaderAdapter({
        findOne: jest.fn(async () => createQueryDefinitionSource({ tenantId: OTHER_TENANT_ID })),
      });
      const nullAdapter = new RuntimeQueryDefinitionReaderAdapter({
        findOne: jest.fn(async () => null),
      });
      const errorAdapter = new RuntimeQueryDefinitionReaderAdapter({
        findOne: jest.fn(async () => {
          throw new Error('reader failed with details that must stay internal');
        }),
      });

      await expect(
        otherTenantAdapter.findByTenantAndId(TENANT_ID, QUERY_DEFINITION_ID),
      ).resolves.toBeNull();
      await expect(
        nullAdapter.findByTenantAndId(TENANT_ID, QUERY_DEFINITION_ID),
      ).resolves.toBeNull();
      await expect(
        errorAdapter.findByTenantAndId(TENANT_ID, QUERY_DEFINITION_ID),
      ).resolves.toBeNull();
    });

    it('preserves status and sanitizes metadata', async () => {
      const adapter = new RuntimeQueryDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createQueryDefinitionSource({
            status: 'draft',
            metadata: {
              domain: 'sales',
              password: 'must-not-leak',
              rawPayload: 'must-not-leak',
            },
          }),
        ),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, QUERY_DEFINITION_ID);

      expect(result?.status).toBe('draft');
      expect(result?.safeMetadata).toEqual({
        domain: 'sales',
        status: 'draft',
        type: 'metric',
      });
      expectSafeJson(result);
    });
  });

  describe('RuntimeDashboardDefinitionReaderAdapter', () => {
    it('maps dashboard widgets to minimal references', async () => {
      const adapter = new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () => createDashboardDefinitionSource()),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID);

      expect(result).toMatchObject({
        id: DASHBOARD_DEFINITION_ID,
        tenantId: TENANT_ID,
        dashboardKey: 'sales_dashboard',
        widgets: [
          {
            key: 'sales_total',
            queryDefinitionId: QUERY_DEFINITION_ID,
            type: 'metric_card',
          },
        ],
      });
      expect(result?.widgets[0]).not.toHaveProperty('options');
      expect(result).not.toHaveProperty('layout');
    });

    it('preserves widgets without queryDefinitionId as missing references', async () => {
      const adapter = new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createDashboardDefinitionSource({
            widgets: [{ key: 'free_text', type: 'text', options: { rawPayload: 'must-not-leak' } }],
          }),
        ),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID);

      expect(result?.widgets).toEqual([
        { key: 'free_text', queryDefinitionId: undefined, type: 'text' },
      ]);
      expectSafeJson(result);
    });

    it('returns null for another tenant or missing dashboard and sanitizes metadata', async () => {
      const otherTenantAdapter = new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createDashboardDefinitionSource({ tenantId: OTHER_TENANT_ID }),
        ),
      });
      const missingAdapter = new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () => null),
      });
      const unsafeAdapter = new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createDashboardDefinitionSource({
            metadata: {
              domain: 'sales',
              token: 'must-not-leak',
            },
          }),
        ),
      });

      await expect(
        otherTenantAdapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID),
      ).resolves.toBeNull();
      await expect(
        missingAdapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID),
      ).resolves.toBeNull();
      expect(
        (await unsafeAdapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID))?.safeMetadata,
      ).toMatchObject({
        domain: 'sales',
        widgetsCount: 1,
      });
      expectSafeJson(await unsafeAdapter.findByTenantAndId(TENANT_ID, DASHBOARD_DEFINITION_ID));
    });
  });

  describe('RuntimeReportDefinitionReaderAdapter', () => {
    it('maps report query and dashboard references plus blocks', async () => {
      const adapter = new RuntimeReportDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createReportDefinitionSource({
            dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
            blocks: [
              { key: 'query_block', type: 'table', queryDefinitionId: QUERY_DEFINITION_ID },
              {
                key: 'dashboard_block',
                type: 'dashboard_widget',
                dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
                options: { rawPayload: 'must-not-leak' },
              },
            ],
          }),
        ),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, REPORT_DEFINITION_ID);

      expect(result).toMatchObject({
        id: REPORT_DEFINITION_ID,
        tenantId: TENANT_ID,
        reportKey: 'sales_report',
        queryDefinitionId: QUERY_DEFINITION_ID,
        dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
        blocks: [
          { key: 'query_block', queryDefinitionId: QUERY_DEFINITION_ID, type: 'table' },
          {
            key: 'dashboard_block',
            dashboardDefinitionId: DASHBOARD_DEFINITION_ID,
            type: 'dashboard_widget',
          },
        ],
      });
      expect(result).not.toHaveProperty('exportOptions');
      expect(result?.blocks[1]).not.toHaveProperty('options');
      expectSafeJson(result);
    });

    it('returns null for another tenant or missing report and sanitizes metadata', async () => {
      const otherTenantAdapter = new RuntimeReportDefinitionReaderAdapter({
        findOne: jest.fn(async () => createReportDefinitionSource({ tenantId: OTHER_TENANT_ID })),
      });
      const missingAdapter = new RuntimeReportDefinitionReaderAdapter({
        findOne: jest.fn(async () => null),
      });
      const unsafeAdapter = new RuntimeReportDefinitionReaderAdapter({
        findOne: jest.fn(async () =>
          createReportDefinitionSource({
            metadata: {
              domain: 'sales',
              authorization: 'Bearer must-not-leak',
            },
          }),
        ),
      });

      await expect(
        otherTenantAdapter.findByTenantAndId(TENANT_ID, REPORT_DEFINITION_ID),
      ).resolves.toBeNull();
      await expect(
        missingAdapter.findByTenantAndId(TENANT_ID, REPORT_DEFINITION_ID),
      ).resolves.toBeNull();
      expect(
        (await unsafeAdapter.findByTenantAndId(TENANT_ID, REPORT_DEFINITION_ID))?.safeMetadata,
      ).toMatchObject({
        domain: 'sales',
        blocksCount: 1,
      });
      expectSafeJson(await unsafeAdapter.findByTenantAndId(TENANT_ID, REPORT_DEFINITION_ID));
    });
  });

  describe('RuntimeDatasetReaderAdapter', () => {
    it('maps dataset connectionId, sourceType, status, and schemaMappingVersion', async () => {
      const adapter = new RuntimeDatasetReaderAdapter({
        findOne: jest.fn(async () => createDatasetSource()),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, DATASET_ID);

      expect(result).toMatchObject({
        id: DATASET_ID,
        tenantId: TENANT_ID,
        datasetKey: 'sales_orders',
        connectionId: CONNECTION_ID,
        sourceType: 'rest_api',
        status: 'active',
        schemaMappingVersion: 'mapping_v1',
      });
      expect(result).not.toHaveProperty('settings');
      expect(result).not.toHaveProperty('fields');
    });

    it('maps missing sourceType as undefined and sanitizes metadata', async () => {
      const adapter = new RuntimeDatasetReaderAdapter({
        findOne: jest.fn(async () =>
          createDatasetSource({
            sourceType: undefined,
            metadata: {
              domain: 'sales',
              connectionString: 'Server=example.invalid;Password=must-not-leak',
            },
          }),
        ),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, DATASET_ID);

      expect(result?.sourceType).toBeUndefined();
      expect(result?.safeMetadata).toMatchObject({
        domain: 'sales',
        status: 'active',
        schemaMappingVersion: 'mapping_v1',
      });
      expectSafeJson(result);
    });

    it('returns null for another tenant or missing dataset', async () => {
      const otherTenantAdapter = new RuntimeDatasetReaderAdapter({
        findOne: jest.fn(async () => createDatasetSource({ tenantId: OTHER_TENANT_ID })),
      });
      const missingAdapter = new RuntimeDatasetReaderAdapter({
        findOne: jest.fn(async () => null),
      });

      await expect(otherTenantAdapter.findByTenantAndId(TENANT_ID, DATASET_ID)).resolves.toBeNull();
      await expect(missingAdapter.findByTenantAndId(TENANT_ID, DATASET_ID)).resolves.toBeNull();
    });
  });

  describe('RuntimeFieldMappingReaderAdapter', () => {
    it.each([
      ['sql_server', 'Pedidos', 'ValorTotal'],
      ['rest_api', '$.items[*]', 'amount'],
      ['mongodb', 'orders', 'items.amount'],
      ['file', 'sheet:Vendas', 'Valor Total'],
    ])(
      'preserves source-agnostic %s mapping paths',
      async (_sourceType, sourceObject, sourceFieldPath) => {
        const adapter = new RuntimeFieldMappingReaderAdapter({
          findByFilters: jest.fn(async () => ({
            items: [createFieldMappingSource({ sourceObject, sourceFieldPath })],
          })),
        });

        const result = await adapter.findByTenantAndDatasetKey(TENANT_ID, 'sales_orders');

        expect(result).toEqual([
          expect.objectContaining({
            id: FIELD_MAPPING_ID,
            tenantId: TENANT_ID,
            datasetKey: 'sales_orders',
            targetField: 'total_amount',
            sourceObject,
            sourceFieldPath,
            logicalField: 'sales.totalAmount',
            dataType: 'number',
            status: 'active',
          }),
        ]);
        expect(result[0]).not.toHaveProperty('table');
        expect(result[0]).not.toHaveProperty('column');
      },
    );

    it('sanitizes mapping metadata and returns [] for another tenant or dataset', async () => {
      const adapter = new RuntimeFieldMappingReaderAdapter({
        findByFilters: jest.fn(async () => ({
          items: [
            createFieldMappingSource({
              metadata: {
                domain: 'sales',
                secret: 'must-not-leak',
              },
            }),
            createFieldMappingSource({ id: 'other_mapping', datasetKey: 'inventory' }),
            createFieldMappingSource({ id: 'other_tenant_mapping', tenantId: OTHER_TENANT_ID }),
          ],
        })),
      });

      const result = await adapter.findByTenantAndDatasetKey(TENANT_ID, 'sales_orders');
      const empty = await adapter.findByTenantAndDatasetKey(TENANT_ID, 'missing_dataset');

      expect(result).toHaveLength(1);
      expect(result[0]?.safeMetadata).toMatchObject({
        domain: 'sales',
        sourceObject: '$.items[*]',
        sourceFieldPath: 'amount',
      });
      expect(empty).toEqual([]);
      expectSafeJson(result);
    });

    it('returns [] on internal reader errors', async () => {
      const adapter = new RuntimeFieldMappingReaderAdapter({
        findByFilters: jest.fn(async () => {
          throw new Error('reader failed');
        }),
      });

      await expect(adapter.findByTenantAndDatasetKey(TENANT_ID, 'sales_orders')).resolves.toEqual(
        [],
      );
    });
  });

  describe('RuntimeConnectionReaderAdapter', () => {
    it('maps a safe credentialRef when the dependency exposes it', async () => {
      const adapter = new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () => createConnectionSource()),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, CONNECTION_ID);

      expect(result).toMatchObject({
        id: CONNECTION_ID,
        tenantId: TENANT_ID,
        type: 'rest_api',
        sourceType: 'rest_api',
        status: 'active',
        credentialRef: CREDENTIAL_REF,
        authType: 'api_key_header',
      });
      expect(result).not.toHaveProperty('baseUrl');
      expect(result).not.toHaveProperty('allowedHeaders');
    });

    it('keeps credentialRef undefined when only hasCredentialReference is available', async () => {
      const adapter = new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () =>
          createConnectionSource({
            credentialRef: undefined,
            hasCredentialReference: true,
          }),
        ),
      });

      const result = await adapter.findByTenantAndId(TENANT_ID, CONNECTION_ID);

      expect(result?.credentialRef).toBeUndefined();
      expect(result?.safeMetadata).toMatchObject({
        hasCredentialReference: true,
      });
      expectSafeJson(result);
    });

    it('sanitizes connection metadata and returns null for another tenant or missing connection', async () => {
      const unsafeAdapter = new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () =>
          createConnectionSource({
            metadata: {
              region: 'br',
              connectionString: 'Server=example.invalid;Password=must-not-leak',
              password: 'must-not-leak',
            },
          }),
        ),
      });
      const otherTenantAdapter = new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () => createConnectionSource({ tenantId: OTHER_TENANT_ID })),
      });
      const missingAdapter = new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () => null),
      });

      const unsafe = await unsafeAdapter.findByTenantAndId(TENANT_ID, CONNECTION_ID);

      expect(unsafe?.safeMetadata).toMatchObject({
        region: 'br',
        type: 'rest_api',
      });
      expect(unsafe?.id).toBe(CONNECTION_ID);
      await expect(
        otherTenantAdapter.findByTenantAndId(TENANT_ID, CONNECTION_ID),
      ).resolves.toBeNull();
      await expect(missingAdapter.findByTenantAndId(TENANT_ID, CONNECTION_ID)).resolves.toBeNull();
      expectSafeJson(unsafe);
    });
  });

  describe('RuntimeCredentialReferenceReaderAdapter', () => {
    it('returns a minimal credential reference shape without maskedPreview', async () => {
      const adapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () => createCredentialSource()),
      });

      const result = await adapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF);

      expect(result).toEqual({
        credentialRef: CREDENTIAL_REF,
        tenantId: TENANT_ID,
        status: 'active',
        provider: 'customer-api',
        safeMetadata: {
          provider: 'customer-api',
          status: 'active',
        },
      });
      expect(result).not.toHaveProperty('maskedPreview');
    });

    it('preserves inactive status for resolver policy and never reads protectedSecretValue', async () => {
      const probe = createCredentialProbe({ status: 'revoked' });
      const adapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () => probe.credential),
      });

      const result = await adapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF);

      expect(result?.status).toBe('revoked');
      expect(probe.protectedSecretValueReads()).toBe(0);
      expectSafeJson(result);
    });

    it('resolves cred_<id> through findOne when a direct safe finder is not available', async () => {
      const findOne = jest.fn(async () => createCredentialSource({ credentialRef: undefined }));
      const adapter = new RuntimeCredentialReferenceReaderAdapter({ findOne });

      const result = await adapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF);

      expect(findOne).toHaveBeenCalledWith(TENANT_ID, CREDENTIAL_ID);
      expect(result?.credentialRef).toBe(CREDENTIAL_REF);
    });

    it('returns null for another tenant, mismatched ref, missing credential, and internal errors', async () => {
      const otherTenantAdapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () =>
          createCredentialSource({ tenantId: OTHER_TENANT_ID }),
        ),
      });
      const mismatchAdapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () =>
          createCredentialSource({ credentialRef: `cred_${REPORT_DEFINITION_ID}` }),
        ),
      });
      const missingAdapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () => null),
      });
      const errorAdapter = new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () => {
          throw new Error('reader failed');
        }),
      });

      await expect(
        otherTenantAdapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF),
      ).resolves.toBeNull();
      await expect(
        mismatchAdapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF),
      ).resolves.toBeNull();
      await expect(
        missingAdapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF),
      ).resolves.toBeNull();
      await expect(
        errorAdapter.findByTenantAndCredentialRef(TENANT_ID, CREDENTIAL_REF),
      ).resolves.toBeNull();
    });
  });

  it('resolves a query happy path through adapters and the real RuntimeConnectorReferenceResolver', async () => {
    const safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder();
    const dependencies: RuntimeConnectorReferenceResolverDependencies = {
      queryDefinitionReader: new RuntimeQueryDefinitionReaderAdapter({
        findOne: jest.fn(async () => createQueryDefinitionSource()),
      }),
      dashboardDefinitionReader: new RuntimeDashboardDefinitionReaderAdapter({
        findOne: jest.fn(async () => createDashboardDefinitionSource()),
      }),
      reportDefinitionReader: new RuntimeReportDefinitionReaderAdapter({
        findOne: jest.fn(async () => createReportDefinitionSource()),
      }),
      datasetReader: new RuntimeDatasetReaderAdapter({
        findOne: jest.fn(async () => createDatasetSource({ sourceType: 'sql_server' })),
      }),
      fieldMappingReader: new RuntimeFieldMappingReaderAdapter({
        findByFilters: jest.fn(async () => ({
          items: [
            createFieldMappingSource({
              sourceObject: 'Pedidos',
              sourceFieldPath: 'ValorTotal',
            }),
          ],
        })),
      }),
      connectionReader: new RuntimeConnectionReaderAdapter({
        findOne: jest.fn(async () =>
          createConnectionSource({ type: 'database', sourceType: 'sql_server' }),
        ),
      }),
      credentialReferenceReader: new RuntimeCredentialReferenceReaderAdapter({
        findByTenantAndCredentialRef: jest.fn(async () => createCredentialSource()),
      }),
      safeMetadataBuilder,
    };
    const resolver = new RuntimeConnectorReferenceResolver(dependencies);

    const result = await resolver.resolveReferences({
      tenantId: TENANT_ID,
      executionRequest: {
        id: '662d4f6e7a1c2b00124f0901',
        tenantId: TENANT_ID,
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.FutureRuntime,
        status: ExecutionRequestStatus.Accepted,
        requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
        queryDefinitionId: QUERY_DEFINITION_ID,
      },
    });

    expect(result.resolved).toBe(true);
    expect(result.references).toMatchObject({
      tenantId: TENANT_ID,
      queryDefinitionId: QUERY_DEFINITION_ID,
      datasetId: DATASET_ID,
      connectionId: CONNECTION_ID,
      credentialRef: CREDENTIAL_REF,
      sourceType: 'sql_server',
    });
    expect(result.references?.fieldMappings[0]).toMatchObject({
      sourceObject: 'Pedidos',
      sourceFieldPath: 'ValorTotal',
    });
    expectSafeJson(result);
  });
});

function createQueryDefinitionSource(
  overrides: Partial<RuntimeQueryDefinitionReaderAdapterSource> = {},
): RuntimeQueryDefinitionReaderAdapterSource {
  return {
    id: QUERY_DEFINITION_ID,
    tenantId: TENANT_ID,
    datasetId: DATASET_ID,
    queryKey: 'sales_overview',
    status: 'active',
    type: 'metric',
    metrics: [{ key: 'total_sales' }],
    settings: { visibleInBuilder: true },
    metadata: { domain: 'sales' },
    ...overrides,
  };
}

function createDashboardDefinitionSource(
  overrides: Partial<RuntimeDashboardDefinitionReaderAdapterSource> = {},
): RuntimeDashboardDefinitionReaderAdapterSource {
  return {
    id: DASHBOARD_DEFINITION_ID,
    tenantId: TENANT_ID,
    dashboardKey: 'sales_dashboard',
    status: 'active',
    visibility: 'tenant',
    layout: { type: 'grid' },
    widgets: [
      {
        key: 'sales_total',
        queryDefinitionId: QUERY_DEFINITION_ID,
        type: 'metric_card',
        options: { showTrend: true },
      },
    ],
    metadata: { domain: 'sales' },
    ...overrides,
  };
}

function createReportDefinitionSource(
  overrides: Partial<RuntimeReportDefinitionReaderAdapterSource> = {},
): RuntimeReportDefinitionReaderAdapterSource {
  return {
    id: REPORT_DEFINITION_ID,
    tenantId: TENANT_ID,
    reportKey: 'sales_report',
    status: 'active',
    visibility: 'tenant',
    queryDefinitionId: QUERY_DEFINITION_ID,
    blocks: [
      {
        key: 'sales_table',
        queryDefinitionId: QUERY_DEFINITION_ID,
        type: 'table',
      },
    ],
    exportOptions: { defaultFormat: 'pdf' },
    metadata: { domain: 'sales' },
    ...overrides,
  };
}

function createDatasetSource(
  overrides: Partial<RuntimeDatasetReaderAdapterSource> = {},
): RuntimeDatasetReaderAdapterSource {
  return {
    id: DATASET_ID,
    tenantId: TENANT_ID,
    datasetKey: 'sales_orders',
    connectionId: CONNECTION_ID,
    sourceType: 'rest_api',
    status: 'active',
    schemaMappingVersion: 'mapping_v1',
    fields: [{ key: 'total_amount' }],
    settings: { defaultPageSize: 50 },
    metadata: { domain: 'sales' },
    ...overrides,
  };
}

function createFieldMappingSource(
  overrides: Partial<RuntimeFieldMappingReaderAdapterSource> = {},
): RuntimeFieldMappingReaderAdapterSource {
  return {
    id: FIELD_MAPPING_ID,
    tenantId: TENANT_ID,
    connectionId: CONNECTION_ID,
    datasetKey: 'sales_orders',
    targetField: 'total_amount',
    sourceObject: '$.items[*]',
    sourceFieldPath: 'amount',
    logicalField: 'sales.totalAmount',
    dataType: 'number',
    targetType: 'number',
    required: true,
    transform: 'trim',
    status: 'active',
    metadata: { domain: 'sales' },
    ...overrides,
  };
}

function createConnectionSource(
  overrides: Partial<RuntimeConnectionReaderAdapterSource> = {},
): RuntimeConnectionReaderAdapterSource {
  return {
    id: CONNECTION_ID,
    tenantId: TENANT_ID,
    type: 'rest_api',
    sourceType: 'rest_api',
    status: 'active',
    credentialRef: CREDENTIAL_REF,
    authType: 'api_key_header',
    hasCredentialReference: true,
    baseUrl: 'https://api.example.invalid',
    allowedHeaders: ['x-safe-header'],
    metadata: { region: 'br' },
    ...overrides,
  };
}

function createCredentialSource(
  overrides: Partial<RuntimeCredentialReferenceReaderAdapterSource> = {},
): RuntimeCredentialReferenceReaderAdapterSource {
  return {
    id: CREDENTIAL_ID,
    credentialRef: CREDENTIAL_REF,
    tenantId: TENANT_ID,
    status: 'active',
    provider: 'customer-api',
    type: 'api_key',
    maskedPreview: '********demo',
    metadata: {
      provider: 'customer-api',
    },
    ...overrides,
  };
}

function createCredentialProbe(
  overrides: Partial<RuntimeCredentialReferenceReaderAdapterSource> = {},
): {
  readonly credential: RuntimeCredentialReferenceReaderAdapterSource;
  readonly protectedSecretValueReads: () => number;
} {
  let reads = 0;
  const credential = createCredentialSource(overrides);

  Object.defineProperty(credential, 'protectedSecretValue', {
    enumerable: true,
    get: () => {
      reads += 1;
      return 'must-not-leak';
    },
  });

  Object.defineProperty(credential, 'secretValue', {
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
    'maskedpreview',
  ].forEach((fragment) => {
    expect(json).not.toContain(fragment);
  });
}
