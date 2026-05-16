import { FieldMappingTargetType } from '../../src/modules/field-mappings/schemas/field-mapping.schema';
import { ExecutionRequestKind } from '../../src/modules/runtime/schemas/execution-request.schema';
import { E2EApp, startE2EApp } from './support/e2e-app';
import { E2E_ACTOR_ID, E2E_TENANT_ID, e2eRequest } from './support/e2e-client';

const MUTATION = { role: 'operator', actorId: E2E_ACTOR_ID } as const;

describe('E2E: runtime foundation never starts real execution', () => {
  let app: E2EApp;
  let queryDefinitionId: string;
  let executionRequestId: string;

  beforeAll(async () => {
    app = await startE2EApp();

    const dataset = await e2eRequest(app.baseUrl, '/api/v1/datasets', {
      method: 'POST',
      ...MUTATION,
      body: { tenantId: E2E_TENANT_ID, datasetKey: 'e2e_runtime', name: 'E2E runtime dataset' },
    });
    const queryDefinition = await e2eRequest(app.baseUrl, '/api/v1/query-definitions', {
      method: 'POST',
      ...MUTATION,
      body: {
        tenantId: E2E_TENANT_ID,
        datasetId: dataset.body.id,
        queryKey: 'e2e_runtime_query',
        name: 'E2E runtime query',
      },
    });
    await e2eRequest(app.baseUrl, '/api/v1/field-mappings', {
      method: 'POST',
      ...MUTATION,
      body: {
        tenantId: E2E_TENANT_ID,
        datasetKey: 'e2e_runtime',
        sourcePath: 'order.total',
        targetField: 'totalAmount',
        targetType: FieldMappingTargetType.Money,
      },
    });
    queryDefinitionId = queryDefinition.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a foundation execution request without starting real execution', async () => {
    const created = await e2eRequest(app.baseUrl, '/api/v1/runtime/execution-requests', {
      method: 'POST',
      ...MUTATION,
      body: { tenantId: E2E_TENANT_ID, kind: ExecutionRequestKind.Query, queryDefinitionId },
    });

    expect(created.status).toBe(201);
    expect(typeof created.body.id).toBe('string');
    expect(created.body.tenantId).toBe(E2E_TENANT_ID);
    expect(created.raw.toLowerCase()).toContain('no real execution');

    executionRequestId = created.body.id as string;
  });

  it('seeds an initial lifecycle event in the standard list envelope', async () => {
    const res = await e2eRequest(
      app.baseUrl,
      `/api/v1/runtime/execution-requests/${executionRequestId}/events?tenantId=${E2E_TENANT_ID}`,
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect((res.body.items as unknown[]).length).toBeGreaterThan(0);
    expect(res.body.meta).toMatchObject({ page: expect.any(Number), total: expect.any(Number) });
  });

  it('dry-run reports readiness only, with no real runtime execution', async () => {
    const res = await e2eRequest(
      app.baseUrl,
      `/api/v1/runtime/execution-requests/${executionRequestId}/dry-run?tenantId=${E2E_TENANT_ID}`,
      { method: 'POST', ...MUTATION },
    );

    expect(res.status).toBe(200);
    expect(typeof res.body.mode).toBe('string');
    expect(typeof res.body.reason).toBe('string');
    expect(Array.isArray(res.body.checks)).toBe(true);
    expect(Array.isArray(res.body.blockers)).toBe(true);
    expect(res.raw).toContain('No real runtime execution was started.');
  });

  it('demo-execute returns fictitious foundation data, with no real runtime execution', async () => {
    const res = await e2eRequest(
      app.baseUrl,
      `/api/v1/runtime/execution-requests/${executionRequestId}/demo-execute?tenantId=${E2E_TENANT_ID}`,
      { method: 'POST', ...MUTATION },
    );

    expect(res.status).toBe(200);
    expect(typeof res.body.mode).toBe('string');
    expect(res.raw).toContain('No real runtime execution was started.');
  });
});
