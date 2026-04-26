export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DELFOS_DATABASE_URL: string;
  DELFOS_ADMIN_KEY: string;
  ENCRYPTION_KEY_BASE64: string;
  CORS_ORIGIN: string[];
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
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
  const adminKey = readRequiredString(config, 'DELFOS_ADMIN_KEY');
  const encryptionKeyBase64 = readEncryptionKey(config);
  const corsOrigin = readCsv(config, 'CORS_ORIGIN');
  const logLevel = readEnum(config, 'LOG_LEVEL', allowedLogLevels, 'info');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DELFOS_DATABASE_URL: databaseUrl,
    DELFOS_ADMIN_KEY: adminKey,
    ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
    CORS_ORIGIN: corsOrigin,
    LOG_LEVEL: logLevel,
  };
}

function readPort(config: Record<string, unknown>): number {
  const rawPort = config.PORT ?? 3001;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
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
