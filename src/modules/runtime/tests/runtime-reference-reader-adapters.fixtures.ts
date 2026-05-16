/**
 * Shared fixtures and fakes for the runtime reference reader adapter specs.
 * Extracted so the spec files stay within the size guideline while still
 * sharing identical, deterministic, fictitious test data. No real secrets.
 */
import {
  RuntimeConnectionReaderAdapterSource,
  RuntimeCredentialReferenceReaderAdapterSource,
  RuntimeDashboardDefinitionReaderAdapterSource,
  RuntimeDatasetReaderAdapterSource,
  RuntimeFieldMappingReaderAdapterSource,
  RuntimeQueryDefinitionReaderAdapterSource,
  RuntimeReportDefinitionReaderAdapterSource,
} from '../bridge';

export const TENANT_ID = '662d4f6e7a1c2b00124f0001';
export const OTHER_TENANT_ID = '662d4f6e7a1c2b00124f0002';
export const QUERY_DEFINITION_ID = '662d4f6e7a1c2b00124f0601';
export const DASHBOARD_DEFINITION_ID = '662d4f6e7a1c2b00124f0701';
export const REPORT_DEFINITION_ID = '662d4f6e7a1c2b00124f0801';
export const DATASET_ID = '662d4f6e7a1c2b00124f0501';
export const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';
export const CREDENTIAL_ID = '662d4f6e7a1c2b00124f0401';
export const CREDENTIAL_REF = `cred_${CREDENTIAL_ID}`;
export const FIELD_MAPPING_ID = '662d4f6e7a1c2b00124f0511';

export function createQueryDefinitionSource(
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

export function createDashboardDefinitionSource(
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

export function createReportDefinitionSource(
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

export function createDatasetSource(
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

export function createFieldMappingSource(
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

export function createConnectionSource(
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

export function createCredentialSource(
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

export function createCredentialProbe(
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
    'maskedpreview',
  ].forEach((fragment) => {
    expect(json).not.toContain(fragment);
  });
}
