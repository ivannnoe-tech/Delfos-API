import { sanitizeMetadata } from './sanitize-metadata';

describe('sanitizeMetadata', () => {
  it('keeps only primitive non-sensitive metadata values', () => {
    const result = sanitizeMetadata({
      environment: 'sandbox',
      retries: 2,
      enabled: true,
      note: null,
      token: 'must-not-leak',
      password: 'must-not-leak',
      supportUrl: 'https://user:pass@customer.example',
      authHeader: 'Bearer abcdef123456',
      generatedKey: 'Abcdef1234567890Abcdef1234567890Abcdef12',
      nested: { unsafe: true },
    });

    expect(result).toEqual({
      environment: 'sandbox',
      retries: 2,
      enabled: true,
      note: null,
    });
  });
});
