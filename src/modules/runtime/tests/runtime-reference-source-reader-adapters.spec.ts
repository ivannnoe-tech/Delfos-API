/**
 * Reference reader adapter specs — source readers (field mapping, connection,
 * credential) plus the end-to-end happy path through the real
 * `RuntimeConnectorReferenceResolver`. The definition readers live in
 * `runtime-reference-reader-adapters.spec.ts`; shared fixtures live in
 * `runtime-reference-reader-adapters.fixtures.ts`.
 */
import {
  RuntimeConnectionReaderAdapter,
  RuntimeConnectorReferenceResolver,
  RuntimeConnectorReferenceResolverDependencies,
  RuntimeConnectorSafeMetadataBuilder,
  RuntimeCredentialReferenceReaderAdapter,
  RuntimeDashboardDefinitionReaderAdapter,
  RuntimeDatasetReaderAdapter,
  RuntimeFieldMappingReaderAdapter,
  RuntimeQueryDefinitionReaderAdapter,
  RuntimeReportDefinitionReaderAdapter,
} from '../bridge';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import {
  CONNECTION_ID,
  CREDENTIAL_ID,
  CREDENTIAL_REF,
  DATASET_ID,
  FIELD_MAPPING_ID,
  OTHER_TENANT_ID,
  QUERY_DEFINITION_ID,
  REPORT_DEFINITION_ID,
  TENANT_ID,
  createConnectionSource,
  createCredentialProbe,
  createCredentialSource,
  createDashboardDefinitionSource,
  createDatasetSource,
  createFieldMappingSource,
  createQueryDefinitionSource,
  createReportDefinitionSource,
  expectSafeJson,
} from './runtime-reference-reader-adapters.fixtures';

describe('Runtime reference reader adapters - source readers', () => {
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
