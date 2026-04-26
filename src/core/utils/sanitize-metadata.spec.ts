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
