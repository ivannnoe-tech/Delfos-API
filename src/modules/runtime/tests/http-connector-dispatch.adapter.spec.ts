import { AppConfigService, ConnectorDispatchConfig } from '../../../config/app-config.service';
import {
  CredentialBrokerError,
  CredentialBrokerPort,
} from '../../credentials/services/credential-broker.service';
import { ResolvedSecret } from '../../credentials/services/resolved-secret';
import { ConnectorExecutionCommandShape } from '../bridge';
import {
  ConnectorDispatchTransport,
  ConnectorDispatchTransportRequest,
  ConnectorDispatchTransportResponse,
} from '../dispatch/connector-dispatch-transport';
import { HttpConnectorDispatchAdapter } from '../dispatch/http-connector-dispatch.adapter';

const sleep = async (): Promise<void> => undefined;

function command(
  overrides: Partial<ConnectorExecutionCommandShape> = {},
): ConnectorExecutionCommandShape {
  return {
    executionRequestId: 'exec-1',
    tenantId: 'tenant-1',
    capability: 'execute_query_preview',
    mode: 'preview',
    requestedAt: '2026-05-03T12:00:00.000Z',
    requestId: 'req-1',
    correlationId: 'corr-1',
    safeParameters: {},
    metadata: {},
    credentialRef: 'cred_abc',
    connectionId: 'conn-1',
    ...overrides,
  };
}

function appConfig(overrides: Partial<ConnectorDispatchConfig> = {}): AppConfigService {
  const cfg: ConnectorDispatchConfig = {
    enabled: true,
    baseUrl: 'https://connectors.local/dispatch',
    timeoutMs: 1000,
    maxRetries: 1,
    clientCertBase64: 'c',
    clientKeyBase64: 'k',
    caBase64: 'a',
    ...overrides,
  };
  return {
    get connectorDispatch(): ConnectorDispatchConfig {
      return cfg;
    },
  } as AppConfigService;
}

function brokerOk(secret = 'customer-secret-9999') {
  const calls: Array<[string, string]> = [];
  const resolveSecret = jest.fn(async (tenantId: string, credentialRef: string) => {
    calls.push([tenantId, credentialRef]);
    return ResolvedSecret.fromBuffer(Buffer.from(secret, 'utf8'));
  });
  return { broker: { resolveSecret } as CredentialBrokerPort, calls, resolveSecret };
}

function brokerFail() {
  const resolveSecret = jest.fn(async () => {
    throw new CredentialBrokerError('credential_not_found');
  });
  return { broker: { resolveSecret } as CredentialBrokerPort, resolveSecret };
}

function transport(queue: Array<ConnectorDispatchTransportResponse | Error>) {
  const requests: ConnectorDispatchTransportRequest[] = [];
  let index = 0;
  const post = jest.fn(async (request: ConnectorDispatchTransportRequest) => {
    requests.push(request);
    const next = queue[Math.min(index, queue.length - 1)];
    index += 1;
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });
  return { transport: { post } as ConnectorDispatchTransport, requests, post };
}

describe('HttpConnectorDispatchAdapter', () => {
  it('returns not_supported without resolving a secret or calling the transport when disabled', async () => {
    const b = brokerOk();
    const t = transport([]);
    const adapter = new HttpConnectorDispatchAdapter(
      appConfig({ enabled: false }),
      b.broker,
      t.transport,
      sleep,
    );

    const result = await adapter.dispatch(command());

    expect(result.status).toBe('not_supported');
    expect(result.safeError?.code).toBe('connector_dispatch_disabled');
    expect(b.resolveSecret).not.toHaveBeenCalled();
    expect(t.post).not.toHaveBeenCalled();
  });

  it('resolves the secret, posts with idempotency/correlation headers and the secret in the body, and never leaks it in the result', async () => {
    const b = brokerOk('customer-secret-9999');
    const t = transport([{ statusCode: 200, body: JSON.stringify({ status: 'completed' }) }]);
    const adapter = new HttpConnectorDispatchAdapter(appConfig(), b.broker, t.transport, sleep);

    const result = await adapter.dispatch(command());

    expect(b.calls).toEqual([['tenant-1', 'cred_abc']]);
    expect(t.post).toHaveBeenCalledTimes(1);
    const request = t.requests[0];
    expect(request.url).toBe('https://connectors.local/dispatch');
    expect(request.headers['idempotency-key']).toBe('tenant-1:exec-1');
    expect(request.headers['x-correlation-id']).toBe('corr-1');
    expect(request.headers['x-request-id']).toBe('req-1');
    const sent = JSON.parse(request.body) as {
      command: { executionRequestId: string };
      secret?: string;
    };
    expect(sent.secret).toBe('customer-secret-9999');
    expect(sent.command.executionRequestId).toBe('exec-1');
    expect(result.dispatched).toBe(true);
    expect(result.status).toBe('completed');
    expect(JSON.stringify(result)).not.toContain('customer-secret-9999');
  });

  it('retries on a 5xx response and succeeds within maxRetries', async () => {
    const t = transport([
      { statusCode: 503, body: '' },
      { statusCode: 200, body: JSON.stringify({ status: 'completed' }) },
    ]);
    const adapter = new HttpConnectorDispatchAdapter(
      appConfig({ maxRetries: 1 }),
      brokerOk().broker,
      t.transport,
      sleep,
    );

    const result = await adapter.dispatch(command());

    expect(t.post).toHaveBeenCalledTimes(2);
    expect(result.dispatched).toBe(true);
  });

  it('returns a safe runtime failure when retries are exhausted', async () => {
    const t = transport([
      { statusCode: 500, body: '' },
      { statusCode: 500, body: '' },
    ]);
    const adapter = new HttpConnectorDispatchAdapter(
      appConfig({ maxRetries: 1 }),
      brokerOk().broker,
      t.transport,
      sleep,
    );

    const result = await adapter.dispatch(command());

    expect(t.post).toHaveBeenCalledTimes(2);
    expect(result.dispatched).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.safeError?.category).toBe('runtime');
  });

  it('fails safely without dispatching when the secret cannot be resolved', async () => {
    const t = transport([]);
    const adapter = new HttpConnectorDispatchAdapter(
      appConfig(),
      brokerFail().broker,
      t.transport,
      sleep,
    );

    const result = await adapter.dispatch(command());

    expect(result.dispatched).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.safeError?.code).toBe('connector_dispatch_secret_unavailable');
    expect(result.safeError?.category).toBe('security');
    expect(t.post).not.toHaveBeenCalled();
  });

  it('dispatches without a secret when the command has no credentialRef', async () => {
    const b = brokerOk();
    const t = transport([{ statusCode: 200, body: JSON.stringify({ status: 'accepted' }) }]);
    const adapter = new HttpConnectorDispatchAdapter(appConfig(), b.broker, t.transport, sleep);

    const result = await adapter.dispatch(command({ credentialRef: undefined }));

    expect(b.resolveSecret).not.toHaveBeenCalled();
    const sent = JSON.parse(t.requests[0].body) as { secret?: string };
    expect(sent.secret).toBeUndefined();
    expect(result.dispatched).toBe(true);
  });
});
