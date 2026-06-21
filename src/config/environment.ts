export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  // PostgreSQL primary database (ADR-0035). Sole database since P5 (Mongo removed).
  DELFOS_POSTGRES_URL: string;
  // Valkey cache URL (ADR-0035 / P6). OPTIONAL: when absent the cache is
  // disabled (no-op) and the system serves everything from PostgreSQL/MongoDB.
  VALKEY_URL?: string;
  DELFOS_ADMIN_KEY: string;
  ENCRYPTION_KEY_BASE64: string;
  CORS_ORIGIN: string[];
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SWAGGER_ENABLED: boolean;
  // Connector dispatch transport (ADR-0038). OFF by default; when enabled it
  // requires an https base URL and mTLS material (client cert/key + CA).
  CONNECTOR_DISPATCH_ENABLED: boolean;
  CONNECTOR_DISPATCH_BASE_URL?: string;
  CONNECTOR_DISPATCH_TIMEOUT_MS: number;
  CONNECTOR_DISPATCH_MAX_RETRIES: number;
  CONNECTOR_DISPATCH_CLIENT_CERT_BASE64?: string;
  CONNECTOR_DISPATCH_CLIENT_KEY_BASE64?: string;
  CONNECTOR_DISPATCH_CA_BASE64?: string;
}

const allowedNodeEnvironments = new Set<NodeEnvironment>(['development', 'test', 'production']);
const allowedLogLevels = new Set<EnvironmentVariables['LOG_LEVEL']>([
  'debug',
  'info',
  'warn',
  'error',
]);

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const nodeEnv = readEnum(config, 'NODE_ENV', allowedNodeEnvironments, 'development');
  const port = readPort(config);
  const postgresUrl = readRequiredPostgresUrl(config);
  const valkeyUrl = readOptionalValkeyUrl(config);
  const adminKey = readAdminKey(config);
  const encryptionKeyBase64 = readEncryptionKey(config);
  const corsOrigin = readCsv(config, 'CORS_ORIGIN');
  const logLevel = readEnum(config, 'LOG_LEVEL', allowedLogLevels, 'info');
  const swaggerEnabled = readBoolean(config, 'SWAGGER_ENABLED', nodeEnv !== 'production');
  const connectorDispatch = readConnectorDispatch(config);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DELFOS_POSTGRES_URL: postgresUrl,
    VALKEY_URL: valkeyUrl,
    DELFOS_ADMIN_KEY: adminKey,
    ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
    CORS_ORIGIN: corsOrigin,
    LOG_LEVEL: logLevel,
    SWAGGER_ENABLED: swaggerEnabled,
    ...connectorDispatch,
  };
}

type ConnectorDispatchEnvironment = Pick<
  EnvironmentVariables,
  | 'CONNECTOR_DISPATCH_ENABLED'
  | 'CONNECTOR_DISPATCH_BASE_URL'
  | 'CONNECTOR_DISPATCH_TIMEOUT_MS'
  | 'CONNECTOR_DISPATCH_MAX_RETRIES'
  | 'CONNECTOR_DISPATCH_CLIENT_CERT_BASE64'
  | 'CONNECTOR_DISPATCH_CLIENT_KEY_BASE64'
  | 'CONNECTOR_DISPATCH_CA_BASE64'
>;

function readConnectorDispatch(config: Record<string, unknown>): ConnectorDispatchEnvironment {
  const enabled = readBoolean(config, 'CONNECTOR_DISPATCH_ENABLED', false);
  const baseUrl = readOptionalString(config, 'CONNECTOR_DISPATCH_BASE_URL');
  const timeoutMs = readPositiveInt(config, 'CONNECTOR_DISPATCH_TIMEOUT_MS', 5000);
  const maxRetries = readNonNegativeInt(config, 'CONNECTOR_DISPATCH_MAX_RETRIES', 2);
  const clientCert = readOptionalString(config, 'CONNECTOR_DISPATCH_CLIENT_CERT_BASE64');
  const clientKey = readOptionalString(config, 'CONNECTOR_DISPATCH_CLIENT_KEY_BASE64');
  const ca = readOptionalString(config, 'CONNECTOR_DISPATCH_CA_BASE64');

  if (enabled) {
    if (!baseUrl) {
      throw new Error(
        'CONNECTOR_DISPATCH_BASE_URL is required when CONNECTOR_DISPATCH_ENABLED is true.',
      );
    }
    if (!/^https:\/\//.test(baseUrl)) {
      throw new Error('CONNECTOR_DISPATCH_BASE_URL must use https (mTLS).');
    }
    requireWhenDispatchEnabled(clientCert, 'CONNECTOR_DISPATCH_CLIENT_CERT_BASE64');
    requireWhenDispatchEnabled(clientKey, 'CONNECTOR_DISPATCH_CLIENT_KEY_BASE64');
    requireWhenDispatchEnabled(ca, 'CONNECTOR_DISPATCH_CA_BASE64');
  }

  return {
    CONNECTOR_DISPATCH_ENABLED: enabled,
    CONNECTOR_DISPATCH_BASE_URL: baseUrl,
    CONNECTOR_DISPATCH_TIMEOUT_MS: timeoutMs,
    CONNECTOR_DISPATCH_MAX_RETRIES: maxRetries,
    CONNECTOR_DISPATCH_CLIENT_CERT_BASE64: clientCert,
    CONNECTOR_DISPATCH_CLIENT_KEY_BASE64: clientKey,
    CONNECTOR_DISPATCH_CA_BASE64: ca,
  };
}

function requireWhenDispatchEnabled(value: string | undefined, key: string): void {
  if (!value) {
    throw new Error(`${key} is required when CONNECTOR_DISPATCH_ENABLED is true.`);
  }
}

function readOptionalString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];

  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string when provided.`);
  }

  return value.trim();
}

function readPositiveInt(
  config: Record<string, unknown>,
  key: string,
  defaultValue: number,
): number {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

function readNonNegativeInt(
  config: Record<string, unknown>,
  key: string,
  defaultValue: number,
): number {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${key} must be a non-negative integer.`);
  }

  return parsed;
}

function readPort(config: Record<string, unknown>): number {
  const rawPort = config.PORT ?? 3000;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function readAdminKey(config: Record<string, unknown>): string {
  const value = readRequiredString(config, 'DELFOS_ADMIN_KEY');

  if (value.length < 32) {
    throw new Error('DELFOS_ADMIN_KEY must be at least 32 characters.');
  }

  return value;
}

function readRequiredPostgresUrl(config: Record<string, unknown>): string {
  const value = config.DELFOS_POSTGRES_URL;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('DELFOS_POSTGRES_URL is required.');
  }

  const trimmed = value.trim();

  if (!/^postgres(ql)?:\/\//.test(trimmed)) {
    throw new Error('DELFOS_POSTGRES_URL must start with postgres:// or postgresql://.');
  }

  return trimmed;
}

function readOptionalValkeyUrl(config: Record<string, unknown>): string | undefined {
  const value = config.VALKEY_URL;

  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('VALKEY_URL must be a string when provided.');
  }

  const trimmed = value.trim();

  if (!/^(valkey|rediss?):\/\//.test(trimmed)) {
    throw new Error('VALKEY_URL must start with valkey://, redis:// or rediss://.');
  }

  return trimmed;
}

function readRequiredString(config: Record<string, unknown>, key: string): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function readEncryptionKey(config: Record<string, unknown>): string {
  const value = readRequiredString(config, 'ENCRYPTION_KEY_BASE64');
  const key = Buffer.from(value, 'base64');

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes.');
  }

  return value;
}

function readCsv(config: Record<string, unknown>, key: string): string[] {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readBoolean(config: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;

  throw new Error(`${key} must be a boolean ('true'/'false'/'1'/'0').`);
}

function readEnum<T extends string>(
  config: Record<string, unknown>,
  key: string,
  allowedValues: Set<T>,
  defaultValue: T,
): T {
  const value = config[key] ?? defaultValue;

  if (typeof value !== 'string' || !allowedValues.has(value as T)) {
    throw new Error(`${key} must be one of: ${Array.from(allowedValues).join(', ')}.`);
  }

  return value as T;
}
