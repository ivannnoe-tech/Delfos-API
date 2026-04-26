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
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      PORT: 3001,
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      DELFOS_ADMIN_KEY: 'test-admin-key-not-a-real-secret',
      ENCRYPTION_KEY_BASE64: encryptionKeyBase64,
      CORS_ORIGIN: ['http://localhost:8080', 'http://localhost:3000'],
      LOG_LEVEL: 'debug',
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
});
