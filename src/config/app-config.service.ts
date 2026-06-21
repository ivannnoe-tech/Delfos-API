import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables, NodeEnvironment } from './environment';

/** Connector dispatch transport config (ADR-0038). `enabled` is false by default. */
export interface ConnectorDispatchConfig {
  readonly enabled: boolean;
  readonly baseUrl?: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly clientCertBase64?: string;
  readonly clientKeyBase64?: string;
  readonly caBase64?: string;
}

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  /**
   * PostgreSQL connection URL (ADR-0035). Sole database since P5 (Mongo removed);
   * required and validated at bootstrap.
   */
  get postgresUrl(): string {
    return this.configService.get('DELFOS_POSTGRES_URL', { infer: true });
  }

  /**
   * Valkey cache URL (ADR-0035 / P6). Optional: `undefined` means the cache is
   * disabled and the system serves from the database only.
   */
  get valkeyUrl(): string | undefined {
    return this.configService.get('VALKEY_URL', { infer: true });
  }

  /** Environment label used in cache key namespaces (`delfos:{env}:...`). */
  get cacheEnv(): string {
    const nodeEnv = this.nodeEnv;
    if (nodeEnv === 'production') return 'prod';
    if (nodeEnv === 'test') return 'test';
    return 'local';
  }

  get adminKey(): string {
    return this.configService.get('DELFOS_ADMIN_KEY', { infer: true });
  }

  get encryptionKeyBase64(): string {
    return this.configService.get('ENCRYPTION_KEY_BASE64', { infer: true });
  }

  get corsOrigin(): string[] {
    return this.configService.get('CORS_ORIGIN', { infer: true });
  }

  get logLevel(): EnvironmentVariables['LOG_LEVEL'] {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  get swaggerEnabled(): boolean {
    return this.configService.get('SWAGGER_ENABLED', { infer: true });
  }

  /** Connector dispatch transport config (ADR-0038); disabled by default. */
  get connectorDispatch(): ConnectorDispatchConfig {
    return {
      enabled: this.configService.get('CONNECTOR_DISPATCH_ENABLED', { infer: true }),
      baseUrl: this.configService.get('CONNECTOR_DISPATCH_BASE_URL', { infer: true }),
      timeoutMs: this.configService.get('CONNECTOR_DISPATCH_TIMEOUT_MS', { infer: true }),
      maxRetries: this.configService.get('CONNECTOR_DISPATCH_MAX_RETRIES', { infer: true }),
      clientCertBase64: this.configService.get('CONNECTOR_DISPATCH_CLIENT_CERT_BASE64', {
        infer: true,
      }),
      clientKeyBase64: this.configService.get('CONNECTOR_DISPATCH_CLIENT_KEY_BASE64', {
        infer: true,
      }),
      caBase64: this.configService.get('CONNECTOR_DISPATCH_CA_BASE64', { infer: true }),
    };
  }
}
