import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('parses supported environment variables', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3001',
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      CORS_ORIGIN: 'http://localhost:8080, http://localhost:3000',
      LOG_LEVEL: 'debug',
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      PORT: 3001,
      DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      CORS_ORIGIN: ['http://localhost:8080', 'http://localhost:3000'],
      LOG_LEVEL: 'debug',
    });
  });

  it('rejects missing database URL', () => {
    expect(() => validateEnvironment({})).toThrow('DELFOS_DATABASE_URL is required.');
  });

  it('rejects invalid ports', () => {
    expect(() =>
      validateEnvironment({
        PORT: '70000',
        DELFOS_DATABASE_URL: 'mongodb://localhost:27017/delfos',
      }),
    ).toThrow('PORT must be an integer between 1 and 65535.');
  });
});
