import { validateEnvironment } from './environment';

const encryptionKeyBase64 = Buffer.alloc(32, 1).toString('base64');
const POSTGRES_URL = 'postgresql://delfos:delfos@localhost:5432/delfos';

describe('validateEnvironment', () => {
  it('parses supported environment variables', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3001',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      CORS_ORIGIN: 'http://localhost:8080, http://localhost:3000',
      LOG_LEVEL: 'debug',
      SWAGGER_ENABLED: 'false',
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      PORT: 3001,
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      CORS_ORIGIN: ['http://localhost:8080', 'http://localhost:3000'],
      LOG_LEVEL: 'debug',
      SWAGGER_ENABLED: false,
      CONNECTOR_DISPATCH_ENABLED: false,
      CONNECTOR_DISPATCH_TIMEOUT_MS: 5000,
      CONNECTOR_DISPATCH_MAX_RETRIES: 2,
    });
  });

  it('parses the required PostgreSQL URL', () => {
    const result = validateEnvironment({
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
    });

    expect(result.DELFOS_POSTGRES_URL).toBe(POSTGRES_URL);
  });

  it('rejects a missing or empty PostgreSQL URL', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: '   ',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('DELFOS_POSTGRES_URL is required.');
  });

  it('rejects a malformed PostgreSQL URL', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: 'mysql://localhost:3306/delfos',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('DELFOS_POSTGRES_URL must start with postgres:// or postgresql://.');
  });

  it('parses an optional Valkey URL when provided', () => {
    const result = validateEnvironment({
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      VALKEY_URL: 'redis://localhost:6379',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
    });

    expect(result.VALKEY_URL).toBe('redis://localhost:6379');
  });

  it('rejects a malformed Valkey URL', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: POSTGRES_URL,
        VALKEY_URL: 'http://localhost:6379',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('VALKEY_URL must start with valkey://, redis:// or rediss://.');
  });

  it('rejects missing PostgreSQL URL', () => {
    expect(() => validateEnvironment({})).toThrow('DELFOS_POSTGRES_URL is required.');
  });

  it('rejects missing temporary admin key', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: POSTGRES_URL,
      }),
    ).toThrow('DELFOS_ADMIN_KEY is required.');
  });

  it('rejects missing encryption key', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: POSTGRES_URL,
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      }),
    ).toThrow('ENCRYPTION_KEY_BASE64 is required.');
  });

  it('rejects encryption keys that are not 32 bytes', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: POSTGRES_URL,
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: Buffer.alloc(16, 1).toString('base64'),
      }),
    ).toThrow('ENCRYPTION_KEY_BASE64 must decode to 32 bytes.');
  });

  it('rejects invalid ports', () => {
    expect(() =>
      validateEnvironment({
        PORT: '70000',
        DELFOS_POSTGRES_URL: POSTGRES_URL,
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('PORT must be an integer between 1 and 65535.');
  });

  it('rejects admin keys shorter than 32 characters', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_POSTGRES_URL: POSTGRES_URL,
        DELFOS_ADMIN_KEY: 'too-short',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('DELFOS_ADMIN_KEY must be at least 32 characters.');
  });

  it('accepts admin keys of exactly 32 characters', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3000',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.DELFOS_ADMIN_KEY).toBe('test-admin-key-not-a-real-secret');
  });

  it('enables swagger by default when NODE_ENV is development', () => {
    const result = validateEnvironment({
      NODE_ENV: 'development',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(true);
  });

  it('disables swagger by default when NODE_ENV is production', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(false);
  });

  it('respects explicit SWAGGER_ENABLED=false in development', () => {
    const result = validateEnvironment({
      NODE_ENV: 'development',
      SWAGGER_ENABLED: 'false',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(false);
  });

  it('respects explicit SWAGGER_ENABLED=true in production', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      SWAGGER_ENABLED: 'true',
      DELFOS_POSTGRES_URL: POSTGRES_URL,
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(true);
  });

  it('defaults connector dispatch to disabled with safe defaults', () => {
    const result = validateEnvironment(base());

    expect(result.CONNECTOR_DISPATCH_ENABLED).toBe(false);
    expect(result.CONNECTOR_DISPATCH_TIMEOUT_MS).toBe(5000);
    expect(result.CONNECTOR_DISPATCH_MAX_RETRIES).toBe(2);
    expect(result.CONNECTOR_DISPATCH_BASE_URL).toBeUndefined();
    expect(result.CONNECTOR_DISPATCH_CLIENT_CERT_BASE64).toBeUndefined();
  });

  it('requires a base URL when connector dispatch is enabled', () => {
    expect(() => validateEnvironment({ ...base(), CONNECTOR_DISPATCH_ENABLED: 'true' })).toThrow(
      'CONNECTOR_DISPATCH_BASE_URL is required when CONNECTOR_DISPATCH_ENABLED is true.',
    );
  });

  it('rejects a non-https connector dispatch base URL when enabled', () => {
    expect(() =>
      validateEnvironment({
        ...base(),
        CONNECTOR_DISPATCH_ENABLED: 'true',
        CONNECTOR_DISPATCH_BASE_URL: 'http://connectors.local/dispatch',
        CONNECTOR_DISPATCH_CLIENT_CERT_BASE64: 'cert',
        CONNECTOR_DISPATCH_CLIENT_KEY_BASE64: 'key',
        CONNECTOR_DISPATCH_CA_BASE64: 'ca',
      }),
    ).toThrow('CONNECTOR_DISPATCH_BASE_URL must use https (mTLS).');
  });

  it('requires mTLS client cert, key and CA when connector dispatch is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...base(),
        CONNECTOR_DISPATCH_ENABLED: 'true',
        CONNECTOR_DISPATCH_BASE_URL: 'https://connectors.local/dispatch',
      }),
    ).toThrow(
      'CONNECTOR_DISPATCH_CLIENT_CERT_BASE64 is required when CONNECTOR_DISPATCH_ENABLED is true.',
    );
  });

  it('accepts a fully configured connector dispatch', () => {
    const result = validateEnvironment({
      ...base(),
      CONNECTOR_DISPATCH_ENABLED: 'true',
      CONNECTOR_DISPATCH_BASE_URL: 'https://connectors.local/dispatch',
      CONNECTOR_DISPATCH_TIMEOUT_MS: '2000',
      CONNECTOR_DISPATCH_MAX_RETRIES: '3',
      CONNECTOR_DISPATCH_CLIENT_CERT_BASE64: 'cert',
      CONNECTOR_DISPATCH_CLIENT_KEY_BASE64: 'key',
      CONNECTOR_DISPATCH_CA_BASE64: 'ca',
    });

    expect(result.CONNECTOR_DISPATCH_ENABLED).toBe(true);
    expect(result.CONNECTOR_DISPATCH_BASE_URL).toBe('https://connectors.local/dispatch');
    expect(result.CONNECTOR_DISPATCH_TIMEOUT_MS).toBe(2000);
    expect(result.CONNECTOR_DISPATCH_MAX_RETRIES).toBe(3);
    expect(result.CONNECTOR_DISPATCH_CA_BASE64).toBe('ca');
  });
});

function base(): Record<string, unknown> {
  return {
    DELFOS_POSTGRES_URL: POSTGRES_URL,
    DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
    ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
  };
}
