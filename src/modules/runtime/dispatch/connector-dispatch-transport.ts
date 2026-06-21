import { Agent, request as httpsRequest } from 'node:https';

import { AppConfigService, ConnectorDispatchConfig } from '../../../config/app-config.service';

export interface ConnectorDispatchTransportRequest {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly timeoutMs: number;
}

export interface ConnectorDispatchTransportResponse {
  readonly statusCode: number;
  readonly body: string;
}

/** IO boundary for the connector dispatch HTTP call. Injected so the adapter logic is testable. */
export interface ConnectorDispatchTransport {
  post(request: ConnectorDispatchTransportRequest): Promise<ConnectorDispatchTransportResponse>;
}

export const CONNECTOR_DISPATCH_TRANSPORT = Symbol('CONNECTOR_DISPATCH_TRANSPORT');

export interface ConnectorDispatchTlsOptions {
  readonly cert?: Buffer;
  readonly key?: Buffer;
  readonly ca?: Buffer;
  readonly rejectUnauthorized: boolean;
}

export function buildConnectorDispatchTlsOptions(
  config: ConnectorDispatchConfig,
): ConnectorDispatchTlsOptions {
  return {
    cert: decodeBase64(config.clientCertBase64),
    key: decodeBase64(config.clientKeyBase64),
    ca: decodeBase64(config.caBase64),
    // mTLS requires verifying the peer certificate — never disabled.
    rejectUnauthorized: true,
  };
}

function decodeBase64(value: string | undefined): Buffer | undefined {
  return value ? Buffer.from(value, 'base64') : undefined;
}

/**
 * Thin node:https transport: mutual-TLS POST (ADR-0038). The TLS material comes
 * from config via {@link buildConnectorDispatchTlsOptions}. This is the
 * irreducible IO seam — the adapter logic is tested against a fake transport.
 */
export class NodeHttpsConnectorDispatchTransport implements ConnectorDispatchTransport {
  constructor(private readonly config: AppConfigService) {}

  async post(
    request: ConnectorDispatchTransportRequest,
  ): Promise<ConnectorDispatchTransportResponse> {
    const tls = buildConnectorDispatchTlsOptions(this.config.connectorDispatch);
    const agent = new Agent({
      cert: tls.cert,
      key: tls.key,
      ca: tls.ca,
      rejectUnauthorized: tls.rejectUnauthorized,
    });
    const url = new URL(request.url);

    return new Promise<ConnectorDispatchTransportResponse>((resolve, reject) => {
      const clientRequest = httpsRequest(
        url,
        { method: 'POST', headers: request.headers, agent, timeout: request.timeoutMs },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () =>
            resolve({
              statusCode: response.statusCode ?? 0,
              body: Buffer.concat(chunks).toString('utf8'),
            }),
          );
        },
      );

      clientRequest.on('error', reject);
      clientRequest.on('timeout', () =>
        clientRequest.destroy(new Error('connector_dispatch_timeout')),
      );
      clientRequest.write(request.body);
      clientRequest.end();
    });
  }
}
