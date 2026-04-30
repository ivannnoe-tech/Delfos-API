import { validateEnvironment } from './environment';

const encryptionKeyBase64 = Buffer.alloc(32, 1).toString('base64');

describe('validateEnvironment', () => {
  it('parses supported environment variables', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3001',
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      CORS_ORIGIN: 'http://localhost:8080, http://localhost:3000',
      LOG_LEVEL: 'debug',
      SWAGGER_ENABLED: 'false',
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      PORT: 3001,
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      CORS_ORIGIN: ['http://localhost:8080', 'http://localhost:3000'],
      LOG_LEVEL: 'debug',
      SWAGGER_ENABLED: false,
    });
  });

  it('rejects missing database URL', () => {
    expect(() => validateEnvironment({})).toThrow('DELFOS_DATABASE_URL is required.');
  });

  it('rejects missing temporary admin key', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      }),
    ).toThrow('DELFOS_ADMIN_KEY is required.');
  });

  it('rejects missing encryption key', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      }),
    ).toThrow('ENCRYPTION_KEY_BASE64 is required.');
  });

  it('rejects encryption keys that are not 32 bytes', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: Buffer.alloc(16, 1).toString('base64'),
      }),
    ).toThrow('ENCRYPTION_KEY_BASE64 must decode to 32 bytes.');
  });

  it('rejects invalid ports', () => {
    expect(() =>
      validateEnvironment({
        PORT: '70000',
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
        DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('PORT must be an integer between 1 and 65535.');
  });

  it('rejects admin keys shorter than 32 characters', () => {
    expect(() =>
      validateEnvironment({
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
        DELFOS_ADMIN_KEY: 'too-short',
        ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      }),
    ).toThrow('DELFOS_ADMIN_KEY must be at least 32 characters.');
  });

  it('accepts admin keys of exactly 32 characters', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3000',
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.DELFOS_ADMIN_KEY).toBe('test-admin-key-not-a-real-secret');
  });

  it('enables swagger by default when NODE_ENV is development', () => {
    const result = validateEnvironment({
      NODE_ENV: 'development',
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(true);
  });

  it('disables swagger by default when NODE_ENV is production', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
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
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
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
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      LOG_LEVEL: 'info',
    });

    expect(result.SWAGGER_ENABLED).toBe(true);
  });
});
