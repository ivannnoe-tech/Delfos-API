import { CredentialType } from '../../src/modules/credentials/schemas/credential.constants';
import { E2EApp, startE2EApp } from './support/e2e-app';
import { E2E_ACTOR_ID, E2E_TENANT_ID, e2eRequest } from './support/e2e-client';

const E2E_SECRET_VALUE = 'e2e-fake-secret-value-never-returned';
const E2E_CONNECTION_TOKEN = 'e2e-fake-token-must-not-persist';

describe('E2E: credentials and connections never expose secrets', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await startE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, reads and lists a credential without ever returning the secret', async () => {
    const created = await e2eRequest(app.baseUrl, '/api/v1/credentials', {
      method: 'POST',
      role: 'owner',
      actorId: E2E_ACTOR_ID,
      body: {
        tenantId: E2E_TENANT_ID,
        type: CredentialType.ApiKey,
        name: 'E2E customer credential',
        secretValue: E2E_SECRET_VALUE,
      },
    });

    expect(created.status).toBe(201);
    expect(created.body).not.toHaveProperty('secretValue');
    expect(typeof created.body.credentialRef).toBe('string');
    expect(created.raw).not.toContain(E2E_SECRET_VALUE);

    const credentialId = created.body.id as string;

    const fetched = await e2eRequest(
      app.baseUrl,
      `/api/v1/credentials/${credentialId}?tenantId=${E2E_TENANT_ID}`,
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body).not.toHaveProperty('secretValue');
    expect(fetched.raw).not.toContain(E2E_SECRET_VALUE);

    const list = await e2eRequest(app.baseUrl, `/api/v1/credentials?tenantId=${E2E_TENANT_ID}`);
    expect(list.status).toBe(200);
    expect(list.raw).not.toContain(E2E_SECRET_VALUE);
  });

  it('creates a connection that exposes only a safe credential flag', async () => {
    const created = await e2eRequest(app.baseUrl, '/api/v1/connections', {
      method: 'POST',
      role: 'owner',
      actorId: E2E_ACTOR_ID,
      body: {
        tenantId: E2E_TENANT_ID,
        name: 'E2E customer connection',
        baseUrl: 'https://api.e2e.example',
        metadata: { environment: 'sandbox', accessToken: E2E_CONNECTION_TOKEN },
      },
    });

    expect(created.status).toBe(201);
    expect(typeof created.body.hasCredentialReference).toBe('boolean');
    expect(created.body).not.toHaveProperty('credentialRef');
    expect(created.raw).not.toContain(E2E_CONNECTION_TOKEN);

    const list = await e2eRequest(app.baseUrl, `/api/v1/connections?tenantId=${E2E_TENANT_ID}`);
    expect(list.status).toBe(200);
    expect(list.raw).not.toContain(E2E_CONNECTION_TOKEN);
  });
});
