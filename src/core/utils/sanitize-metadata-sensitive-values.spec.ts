import { isSensitiveMetadataValue, sanitizeMetadata } from './sanitize-metadata';

describe('sanitizeMetadata — sensitive key detection', () => {
  it.each([
    'token',
    'Token',
    'TOKEN',
    'apiKey',
    'api_key',
    'api-key',
    'API_KEY',
    'accessToken',
    'refresh_token',
    'password',
    'userPassword',
    'clientSecret',
    'connectionSecret',
    'authorization',
    'Authorization',
    'privateKey',
    'private_key',
    'credentialValue',
  ])('drops the sensitive key "%s" regardless of casing or separators', (key) => {
    const result = sanitizeMetadata({ [key]: 'fake-secret-xyz', environment: 'sandbox' });

    expect(result).not.toHaveProperty(key);
    expect(result).toEqual({ environment: 'sandbox' });
  });

  it('keeps non-sensitive keys whose name only partially resembles a fragment', () => {
    const result = sanitizeMetadata({
      tokenize: 'plain-label',
      description: 'a safe description',
      retries: 3,
    });

    // "tokenize" contains the fragment "token" and must be dropped.
    expect(result).not.toHaveProperty('tokenize');
    expect(result).toEqual({ description: 'a safe description', retries: 3 });
  });
});

describe('sanitizeMetadata — sensitive value detection', () => {
  it('drops bearer and basic authorization scheme values even under safe keys', () => {
    const result = sanitizeMetadata({
      label: 'Bearer abcdef123456789',
      header: 'Basic dXNlcjpwYXNz',
      environment: 'sandbox',
    });

    expect(result).toEqual({ environment: 'sandbox' });
  });

  it('drops values containing embedded credentials in connection-string form', () => {
    const result = sanitizeMetadata({
      endpoint: 'https://user:fake-secret-xyz@customer.example/db',
      environment: 'sandbox',
    });

    expect(result).toEqual({ environment: 'sandbox' });
  });

  it.each([
    'password=fake-secret-xyz',
    'token=abc123',
    'secret=fake-secret-xyz',
    'api_key=abc123',
    'api-key=abc123',
    'authorization=abc123',
  ])('drops values containing the embedded key/value pair "%s"', (value) => {
    const result = sanitizeMetadata({ note: value, environment: 'sandbox' });

    expect(result).toEqual({ environment: 'sandbox' });
  });

  it('drops high-entropy token-like values that mix cases and digits', () => {
    const result = sanitizeMetadata({
      generatedKey: 'Abcdef1234567890Abcdef1234567890Abcdef12',
      environment: 'sandbox',
    });

    expect(result).toEqual({ environment: 'sandbox' });
  });

  it('keeps long values that are not token-like (contain spaces)', () => {
    const longSentence =
      'This is a long but perfectly safe descriptive sentence about the dataset.';
    const result = sanitizeMetadata({ description: longSentence });

    expect(result).toEqual({ description: longSentence });
  });
});

describe('sanitizeMetadata — value shape rules', () => {
  it('drops nested objects and arrays, keeping only primitive values', () => {
    const result = sanitizeMetadata({
      nested: { unsafe: true },
      list: [1, 2, 3],
      flag: false,
      count: 0,
      empty: null,
    });

    expect(result).toEqual({ flag: false, count: 0, empty: null });
  });

  it('truncates long non-sensitive string values to 500 characters', () => {
    const longValue = 'a'.repeat(900);
    const result = sanitizeMetadata({ note: longValue });

    expect(typeof result.note).toBe('string');
    expect((result.note as string).length).toBe(500);
  });

  it('does not mutate the original input object', () => {
    const input = {
      environment: 'sandbox',
      token: 'fake-secret-xyz',
      nested: { unsafe: true },
    };
    const snapshot = JSON.stringify(input);

    sanitizeMetadata(input);

    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('returns an empty object when no metadata is provided', () => {
    expect(sanitizeMetadata()).toEqual({});
    expect(sanitizeMetadata(undefined)).toEqual({});
  });
});

describe('isSensitiveMetadataValue', () => {
  it.each([
    'Bearer abcdef123456',
    'bearer abcdef123456',
    'Basic dXNlcjpwYXNz',
    'https://user:pass@customer.example',
    'password=value',
    'API-KEY=value',
    'Abcdef1234567890Abcdef1234567890Abcdef12',
  ])('flags "%s" as sensitive', (value) => {
    expect(isSensitiveMetadataValue(value)).toBe(true);
  });

  it.each([
    ['plain label', false],
    ['sandbox', false],
    ['short', false],
    ['a value with spaces that is long enough to exceed forty characters total', false],
  ])('treats "%s" as non-sensitive', (value, expected) => {
    expect(isSensitiveMetadataValue(value)).toBe(expected);
  });

  it('treats non-string values as non-sensitive', () => {
    expect(isSensitiveMetadataValue(42)).toBe(false);
    expect(isSensitiveMetadataValue(true)).toBe(false);
    expect(isSensitiveMetadataValue(null)).toBe(false);
    expect(isSensitiveMetadataValue({ token: 'x' })).toBe(false);
  });
});
