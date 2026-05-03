import { RuntimeConnectorLimitsPolicy } from '../bridge';

describe('RuntimeConnectorLimitsPolicy', () => {
  const policy = new RuntimeConnectorLimitsPolicy();

  it('returns conservative defaults', () => {
    expect(policy.resolve()).toEqual({
      timeoutMs: 5000,
      maxRows: 100,
      previewLimit: 20,
      maxMetadataLength: 256,
    });
  });

  it('clamps overrides above maximum values', () => {
    expect(
      policy.resolve({
        overrides: {
          timeoutMs: 999999,
          maxRows: 999999,
          previewLimit: 999999,
          maxMetadataLength: 999999,
        },
      }),
    ).toEqual({
      timeoutMs: 30000,
      maxRows: 1000,
      previewLimit: 100,
      maxMetadataLength: 256,
    });
  });

  it('uses defaults for zero, negative, non-integer, or non-number overrides', () => {
    expect(
      policy.resolve({
        overrides: {
          timeoutMs: 0,
          maxRows: -1,
          previewLimit: 10.5,
          maxMetadataLength: 'unsafe',
        },
      }),
    ).toEqual({
      timeoutMs: 5000,
      maxRows: 100,
      previewLimit: 20,
      maxMetadataLength: 256,
    });
  });

  it('returns a new immutable object on each call', () => {
    const first = policy.resolve();
    const second = policy.resolve();

    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
  });
});
