import { E2EApp, startE2EApp } from './support/e2e-app';
import { E2E_ACTOR_ID, E2E_TENANT_ID, e2eRequest } from './support/e2e-client';

describe('E2E: foundation catalog flow', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await startE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists datasets with the standard list envelope', async () => {
    const res = await e2eRequest(app.baseUrl, `/api/v1/datasets?tenantId=${E2E_TENANT_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('creates a dataset and a query definition, then lists the query definitions', async () => {
    const dataset = await e2eRequest(app.baseUrl, '/api/v1/datasets', {
      method: 'POST',
      role: 'operator',
      actorId: E2E_ACTOR_ID,
      body: { tenantId: E2E_TENANT_ID, datasetKey: 'e2e_orders', name: 'E2E orders dataset' },
    });

    expect(dataset.status).toBe(201);
    expect(typeof dataset.body.id).toBe('string');
    expect(dataset.body.tenantId).toBe(E2E_TENANT_ID);

    const queryDefinition = await e2eRequest(app.baseUrl, '/api/v1/query-definitions', {
      method: 'POST',
      role: 'operator',
      actorId: E2E_ACTOR_ID,
      body: {
        tenantId: E2E_TENANT_ID,
        datasetId: dataset.body.id,
        queryKey: 'e2e_overview',
        name: 'E2E sales overview',
      },
    });

    expect(queryDefinition.status).toBe(201);
    expect(queryDefinition.body.tenantId).toBe(E2E_TENANT_ID);
    expect(queryDefinition.body.datasetId).toBe(dataset.body.id);

    const list = await e2eRequest(
      app.baseUrl,
      `/api/v1/query-definitions?tenantId=${E2E_TENANT_ID}`,
    );

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
    expect((list.body.items as unknown[]).length).toBeGreaterThan(0);
    expect(list.body.meta).toMatchObject({ page: expect.any(Number), total: expect.any(Number) });
  });
});
