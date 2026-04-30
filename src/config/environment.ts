export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DELFOS_DATABASE_URL: string;
  DELFOS_ADMIN_KEY: string;
  ENCRYPTION_KEY_BASE64: string;
  CORS_ORIGIN: string[];
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SWAGGER_ENABLED: boolean;
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
  const databaseUrl = readRequiredString(config, 'DELFOS_DATABASE_URL');
  const adminKey = readAdminKey(config);
  const encryptionKeyBase64 = readEncryptionKey(config);
  const corsOrigin = readCsv(config, 'CORS_ORIGIN');
  const logLevel = readEnum(config, 'LOG_LEVEL', allowedLogLevels, 'info');
  const swaggerEnabled = readBoolean(config, 'SWAGGER_ENABLED', nodeEnv !== 'production');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DELFOS_DATABASE_URL: databaseUrl,
    DELFOS_ADMIN_KEY: adminKey,
    ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
    CORS_ORIGIN: corsOrigin,
    LOG_LEVEL: logLevel,
    SWAGGER_ENABLED: swaggerEnabled,
  };
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

function readBoolean(
  config: Record<string, unknown>,
  key: string,
  defaultValue: boolean,
): boolean {
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
