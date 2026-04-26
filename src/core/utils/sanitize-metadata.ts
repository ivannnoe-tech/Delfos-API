export type SanitizedMetadataValue = string | number | boolean | null;
export type SanitizedMetadata = Record<string, SanitizedMetadataValue>;

const sensitiveKeyFragments = [
  'authorization',
  'credential',
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
];

export function sanitizeMetadata(input?: Record<string, unknown>): SanitizedMetadata {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<SanitizedMetadata>((metadata, [key, value]) => {
    if (isSensitiveKey(key) || !isAllowedValue(value) || isSensitiveMetadataValue(value)) {
      return metadata;
    }

    metadata[key] = typeof value === 'string' ? value.slice(0, 500) : value;
    return metadata;
  }, {});
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');

  return sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

export function isSensitiveMetadataValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  return (
    /^(bearer|basic)\s+[a-z0-9._~+/=-]+$/i.test(trimmedValue) ||
    /^[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i.test(trimmedValue) ||
    /\b(password|token|secret|api[_-]?key|authorization)=/i.test(trimmedValue) ||
    isHighEntropyLikeValue(trimmedValue)
  );
}

function isHighEntropyLikeValue(value: string): boolean {
  if (value.length < 40 || /\s/.test(value)) {
    return false;
  }

  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasTokenAlphabet = /^[A-Za-z0-9._~+/=-]+$/.test(value);

  return hasTokenAlphabet && hasLowercase && hasUppercase && hasNumber;
}

function isAllowedValue(value: unknown): value is SanitizedMetadataValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
