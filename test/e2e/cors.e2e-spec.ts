import { E2EApp, startE2EApp } from './support/e2e-app';

/**
 * E2E coverage for the CORS whitelist applied in `src/main.ts`.
 *
 * Boots the real AppModule once with `enableCors` configured exactly as the
 * production bootstrap does, then asserts the `Access-Control-Allow-Origin`
 * header on cross-origin preflight (OPTIONS) requests. It proves the whitelist
 * is exact (no wildcard) and that `localhost` and `127.0.0.1` are distinct
 * origins. The disabled-CORS path (`origin: false`) is covered by the
 * `resolveCorsOptions` unit suite — booting a second app here would spin up a
 * second in-memory MongoDB and re-import a config-frozen AppModule.
 */
const ALLOWED_CSV = 'http://localhost:3000,http://127.0.0.1:4174';

async function preflight(
  baseUrl: string,
  origin: string,
): Promise<{ status: number; allowOrigin: string | null }> {
  const response = await fetch(`${baseUrl}/api/v1/datasets`, {
    method: 'OPTIONS',
    headers: {
      origin,
      'access-control-request-method': 'GET',
    },
  });
  // Drain the body so the socket is released between cases.
  await response.text();

  return {
    status: response.status,
    allowOrigin: response.headers.get('access-control-allow-origin'),
  };
}

describe('E2E: CORS whitelist', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await startE2EApp({ corsOrigin: ALLOWED_CSV });
  });

  afterAll(async () => {
    await app.close();
  });

  it('echoes Access-Control-Allow-Origin for an allowed origin', async () => {
    const result = await preflight(app.baseUrl, 'http://localhost:3000');

    expect(result.allowOrigin).toBe('http://localhost:3000');
  });

  it('allows every origin listed in the CSV whitelist', async () => {
    const second = await preflight(app.baseUrl, 'http://127.0.0.1:4174');

    expect(second.allowOrigin).toBe('http://127.0.0.1:4174');
  });

  it('does NOT allow an origin missing from the whitelist', async () => {
    const result = await preflight(app.baseUrl, 'http://evil.example.com');

    expect(result.allowOrigin).toBeNull();
  });

  it('treats localhost and 127.0.0.1 as distinct origins', async () => {
    // Only http://127.0.0.1:4174 is whitelisted on this port — the localhost
    // spelling of the same port must NOT be allowed.
    const result = await preflight(app.baseUrl, 'http://localhost:4174');

    expect(result.allowOrigin).toBeNull();
  });

  it('never returns a wildcard Access-Control-Allow-Origin', async () => {
    const allowed = await preflight(app.baseUrl, 'http://localhost:3000');
    const denied = await preflight(app.baseUrl, 'http://evil.example.com');

    expect(allowed.allowOrigin).not.toBe('*');
    expect(denied.allowOrigin).not.toBe('*');
  });
});
