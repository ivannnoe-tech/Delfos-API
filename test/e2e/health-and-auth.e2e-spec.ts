import { E2EApp, startE2EApp } from './support/e2e-app';
import { E2E_TENANT_ID, e2eRequest } from './support/e2e-client';

describe('E2E: health and authentication', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await startE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and the foundation health shape', async () => {
    const res = await e2eRequest(app.baseUrl, '/health', { adminKey: null });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('rejects a protected endpoint without the admin key (401)', async () => {
    const res = await e2eRequest(app.baseUrl, `/api/v1/datasets?tenantId=${E2E_TENANT_ID}`, {
      adminKey: null,
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
  });

  it('rejects a viewer trying to mutate a protected resource (403)', async () => {
    const res = await e2eRequest(app.baseUrl, '/api/v1/datasets', {
      method: 'POST',
      role: 'viewer',
      body: { tenantId: E2E_TENANT_ID, datasetKey: 'e2e_blocked', name: 'E2E blocked dataset' },
    });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns a safe standardized error when a required tenant is missing', async () => {
    const res = await e2eRequest(app.baseUrl, '/api/v1/datasets');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });
    for (const field of ['requestId', 'correlationId', 'timestamp', 'path', 'method']) {
      expect(res.body[field]).toBeDefined();
    }
  });
});
