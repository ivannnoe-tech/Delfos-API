import { Inject, Injectable, Optional } from '@nestjs/common';

import { AppConfigService, ConnectorDispatchConfig } from '../../../config/app-config.service';
import {
  CREDENTIAL_BROKER,
  CredentialBrokerPort,
} from '../../credentials/services/credential-broker.service';
import { ResolvedSecret } from '../../credentials/services/resolved-secret';
import {
  CONNECTOR_EXECUTION_STATUS_SHAPES,
  ConnectorCommandSafeMetadata,
  ConnectorExecutionCommandShape,
  ConnectorExecutionStatusShape,
  RuntimeConnectorBridgeSafeError,
  RuntimeConnectorDispatchPort,
  RuntimeConnectorDispatchResult,
} from '../bridge';
import {
  CONNECTOR_DISPATCH_TRANSPORT,
  ConnectorDispatchTransport,
  ConnectorDispatchTransportResponse,
} from './connector-dispatch-transport';

export type DispatchSleep = (ms: number) => Promise<void>;

const DISPATCH_STATUSES = new Set<string>(CONNECTOR_EXECUTION_STATUS_SHAPES);

/**
 * Real connector dispatch over HTTP + mTLS (ADR-0038), OFF by default. When
 * disabled it returns `not_supported` and makes NO call and NO secret
 * resolution. When enabled it resolves the secret just-in-time (ADR-0037),
 * sends it ONLY on this channel inside the request body (never in the persisted
 * envelope), with idempotency + correlation headers, a short timeout and
 * bounded retries; the secret is zeroized right after the body is built and is
 * never surfaced in the result.
 */
@Injectable()
export class HttpConnectorDispatchAdapter implements RuntimeConnectorDispatchPort {
  constructor(
    private readonly config: AppConfigService,
    @Inject(CREDENTIAL_BROKER) private readonly broker: CredentialBrokerPort,
    @Inject(CONNECTOR_DISPATCH_TRANSPORT) private readonly transport: ConnectorDispatchTransport,
    @Optional() private readonly sleep: DispatchSleep = defaultSleep,
  ) {}

  async dispatch(command: ConnectorExecutionCommandShape): Promise<RuntimeConnectorDispatchResult> {
    const cfg = this.config.connectorDispatch;
    const safeMetadata: ConnectorCommandSafeMetadata = {
      capability: command.capability,
      mode: command.mode,
    };

    if (!cfg.enabled || !cfg.baseUrl) {
      return {
        dispatched: false,
        status: 'not_supported',
        safeMessage: 'Connector dispatch is disabled.',
        safeError: this.safeError(
          'connector_dispatch_disabled',
          'Connector dispatch is disabled.',
          'not_supported',
          safeMetadata,
        ),
        safeMetadata,
      };
    }

    let resolved: ResolvedSecret | undefined;
    if (command.credentialRef) {
      try {
        resolved = await this.broker.resolveSecret(command.tenantId, command.credentialRef);
      } catch {
        return this.failure(
          'connector_dispatch_secret_unavailable',
          'Credential could not be resolved for dispatch.',
          'security',
          safeMetadata,
        );
      }
    }

    try {
      const body = this.buildBody(command, resolved);
      const response = await this.send(cfg, command, body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          dispatched: true,
          status: this.parseStatus(response.body),
          safeMessage: 'Connector dispatch completed.',
          safeMetadata: { ...safeMetadata, statusCode: response.statusCode },
        };
      }

      return this.failure(
        'connector_dispatch_http_error',
        'Connector dispatch returned an error status.',
        'runtime',
        { ...safeMetadata, statusCode: response.statusCode },
      );
    } catch {
      return this.failure(
        'connector_dispatch_failed',
        'Connector dispatch failed.',
        'runtime',
        safeMetadata,
      );
    } finally {
      resolved?.zeroize();
    }
  }

  private buildBody(command: ConnectorExecutionCommandShape, resolved?: ResolvedSecret): string {
    if (!resolved) {
      return JSON.stringify({ command });
    }
    // use() injects the plaintext for this single dispatch then zeroes the buffer.
    return resolved.use((secret) => JSON.stringify({ command, secret }));
  }

  private async send(
    cfg: ConnectorDispatchConfig,
    command: ConnectorExecutionCommandShape,
    body: string,
  ): Promise<ConnectorDispatchTransportResponse> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'idempotency-key': `${command.tenantId}:${command.executionRequestId}`,
      'x-correlation-id': command.correlationId,
      'x-request-id': command.requestId,
    };

    let lastResponse: ConnectorDispatchTransportResponse | undefined;
    let lastError: unknown;

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt += 1) {
      try {
        const response = await this.transport.post({
          url: cfg.baseUrl as string,
          headers,
          body,
          timeoutMs: cfg.timeoutMs,
        });
        // 5xx is retryable; anything below is returned (success or client error).
        if (response.statusCode < 500) {
          return response;
        }
        lastResponse = response;
      } catch (error) {
        lastError = error;
      }

      if (attempt < cfg.maxRetries) {
        await this.backoff(attempt);
      }
    }

    if (lastResponse) {
      return lastResponse;
    }
    throw lastError instanceof Error ? lastError : new Error('connector_dispatch_failed');
  }

  private async backoff(attempt: number): Promise<void> {
    const base = 50 * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 50);
    await this.sleep(base + jitter);
  }

  private parseStatus(body: string): ConnectorExecutionStatusShape {
    try {
      const parsed = JSON.parse(body) as { status?: unknown };
      if (typeof parsed.status === 'string' && DISPATCH_STATUSES.has(parsed.status)) {
        return parsed.status as ConnectorExecutionStatusShape;
      }
    } catch {
      // Non-JSON or unexpected body — fall through to the safe default.
    }
    return 'accepted';
  }

  private failure(
    code: string,
    message: string,
    category: RuntimeConnectorBridgeSafeError['category'],
    safeMetadata: ConnectorCommandSafeMetadata,
  ): RuntimeConnectorDispatchResult {
    return {
      dispatched: false,
      status: 'failed',
      safeMessage: message,
      safeError: this.safeError(code, message, category, safeMetadata),
      safeMetadata,
    };
  }

  private safeError(
    code: string,
    message: string,
    category: RuntimeConnectorBridgeSafeError['category'],
    safeMetadata: ConnectorCommandSafeMetadata,
  ): RuntimeConnectorBridgeSafeError {
    return { code, safeMessage: message, category, retryable: false, safeMetadata };
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
