/**
 * Reference reader adapter specs — definition readers (query, dashboard,
 * report, dataset). The source readers (field mapping, connection,
 * credential) and the end-to-end happy path live in
 * `runtime-reference-source-reader-adapters.spec.ts`; shared fixtures live in
 * `runtime-reference-reader-adapters.fixtures.ts`.
 */
import {
  RuntimeDashboardDefinitionReaderAdapter,
  RuntimeDatasetReaderAdapter,
  RuntimeQueryDefinitionReaderAdapter,
  RuntimeReportDefinitionReaderAdapter,
} from '../bridge';
import {
  CONNECTION_ID,
  DASHBOARD_DEFINITION_ID,
  DATASET_ID,
  OTHER_TENANT_ID,
  QUERY_DEFINITION_ID,
  REPORT_DEFINITION_ID,
  TENANT_ID,
  createDashboardDefinitionSource,
  createDatasetSource,
  createQueryDefinitionSource,
  createReportDefinitionSource,
  expectSafeJson,
} from './runtime-reference-reader-adapters.fixtures';

describe('Runtime reference reader adapters - definition readers', () => {
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
});
