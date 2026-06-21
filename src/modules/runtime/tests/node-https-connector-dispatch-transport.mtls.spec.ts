import { readFileSync } from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import { createServer, Server } from 'node:https';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';

import { AppConfigService, ConnectorDispatchConfig } from '../../../config/app-config.service';
import { NodeHttpsConnectorDispatchTransport } from '../dispatch/connector-dispatch-transport';

function fixture(name: string): Buffer {
  return readFileSync(join(__dirname, 'fixtures', 'dispatch-mtls', name));
}

const caPem = fixture('ca.crt');
const serverCert = fixture('server.crt');
const serverKey = fixture('server.key');
const clientCert = fixture('client.crt');
const clientKey = fixture('client.key');

function configFor(overrides: Partial<ConnectorDispatchConfig> = {}): AppConfigService {
  const cfg: ConnectorDispatchConfig = {
    enabled: true,
    baseUrl: 'https://localhost',
    timeoutMs: 2000,
    maxRetries: 0,
    clientCertBase64: clientCert.toString('base64'),
    clientKeyBase64: clientKey.toString('base64'),
    caBase64: caPem.toString('base64'),
    ...overrides,
  };
  return {
    get connectorDispatch(): ConnectorDispatchConfig {
      return cfg;
    },
  } as AppConfigService;
}

describe('NodeHttpsConnectorDispatchTransport (real mTLS handshake)', () => {
  let server: Server;
  let port: number;
  let received: { headers: IncomingHttpHeaders; body: string } | undefined;

  beforeAll(async () => {
    server = createServer(
      // requestCert + rejectUnauthorized => the server enforces mutual TLS.
      { cert: serverCert, key: serverKey, ca: caPem, requestCert: true, rejectUnauthorized: true },
      (request, response) => {
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => chunks.push(chunk));
        request.on('end', () => {
          received = { headers: request.headers, body: Buffer.concat(chunks).toString('utf8') };
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ status: 'completed' }));
        });
      },
    );
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    received = undefined;
  });

  it('completes a mutual-TLS POST: presents the client cert, trusts the CA-signed server, and returns the response', async () => {
    const transport = new NodeHttpsConnectorDispatchTransport(configFor());

    const response = await transport.post({
      url: `https://localhost:${port}/dispatch`,
      headers: { 'content-type': 'application/json', 'idempotency-key': 'tenant:exec' },
      body: JSON.stringify({ hello: 'world' }),
      timeoutMs: 2000,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'completed' });
    expect(received?.headers['idempotency-key']).toBe('tenant:exec');
    expect(received ? JSON.parse(received.body) : undefined).toEqual({ hello: 'world' });
  });

  it('fails the handshake when the client presents no certificate', async () => {
    const transport = new NodeHttpsConnectorDispatchTransport(
      configFor({ clientCertBase64: undefined, clientKeyBase64: undefined }),
    );

    await expect(
      transport.post({
        url: `https://localhost:${port}/dispatch`,
        headers: { 'content-type': 'application/json' },
        body: '{}',
        timeoutMs: 2000,
      }),
    ).rejects.toThrow();
  });
});
