import { resolveCorsOptions } from './cors.config';

describe('resolveCorsOptions', () => {
  it('disables CORS when no origin is configured', () => {
    expect(resolveCorsOptions([], 'development')).toEqual({ origin: false });
    expect(resolveCorsOptions([], 'production')).toEqual({ origin: false });
  });

  it('returns the configured origins as an exact-match whitelist', () => {
    const options = resolveCorsOptions(
      ['http://localhost:3000', 'http://127.0.0.1:4174'],
      'development',
    );

    expect(options.origin).toEqual(['http://localhost:3000', 'http://127.0.0.1:4174']);
  });

  it('keeps multiple CSV-derived origins (every entry stays allowed)', () => {
    const origins = [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:4174',
      'http://localhost:4174',
    ];

    expect(resolveCorsOptions(origins, 'development').origin).toEqual(origins);
  });

  it('treats localhost and 127.0.0.1 as distinct origins', () => {
    // Only 127.0.0.1:4174 is whitelisted — localhost:4174 must NOT be implied.
    const options = resolveCorsOptions(['http://127.0.0.1:4174'], 'development');

    expect(options.origin).toContain('http://127.0.0.1:4174');
    expect(options.origin).not.toContain('http://localhost:4174');
  });

  it('trims whitespace and de-duplicates origins without widening the whitelist', () => {
    const options = resolveCorsOptions(
      [' http://localhost:3000 ', 'http://localhost:3000', '  '],
      'development',
    );

    expect(options.origin).toEqual(['http://localhost:3000']);
  });

  it('never resolves to a wildcard in production', () => {
    const options = resolveCorsOptions(
      ['http://localhost:3000', 'http://127.0.0.1:4174'],
      'production',
    );

    expect(options.origin).not.toBe('*');
    expect(options.origin).not.toBe(true);
    expect(Array.isArray(options.origin)).toBe(true);
    expect(options.origin).not.toContain('*');
  });

  it('rejects a wildcard entry instead of opening CORS to everyone', () => {
    expect(() => resolveCorsOptions(['*'], 'development')).toThrow(/wildcard/i);
    expect(() => resolveCorsOptions(['http://localhost:3000', '*'], 'production')).toThrow(
      /wildcard/i,
    );
  });
});
