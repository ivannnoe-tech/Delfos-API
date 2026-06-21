import { ResolvedSecret } from '../services/resolved-secret';

describe('ResolvedSecret', () => {
  it('exposes the secret to a consumer and zeroizes the backing buffer after use', () => {
    const buffer = Buffer.from('super-secret-value', 'utf8');
    const secret = ResolvedSecret.fromBuffer(buffer);

    const seen = secret.use((value) => value);

    expect(seen).toBe('super-secret-value');
    expect(secret.disposed).toBe(true);
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('is single-shot: throws if used after disposal', () => {
    const secret = ResolvedSecret.fromBuffer(Buffer.from('x-secret', 'utf8'));

    secret.use((value) => value);

    expect(() => secret.use((value) => value)).toThrow();
  });

  it('zeroize wipes the buffer and marks it disposed', () => {
    const buffer = Buffer.from('another-secret', 'utf8');
    const secret = ResolvedSecret.fromBuffer(buffer);

    secret.zeroize();

    expect(secret.disposed).toBe(true);
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('never serializes or stringifies the plaintext', () => {
    const secret = ResolvedSecret.fromBuffer(Buffer.from('do-not-leak-me', 'utf8'));

    expect(JSON.stringify({ secret })).not.toContain('do-not-leak-me');
    expect(String(secret)).not.toContain('do-not-leak-me');
  });
});
