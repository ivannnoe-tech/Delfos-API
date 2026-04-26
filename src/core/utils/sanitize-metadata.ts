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
    if (isSensitiveKey(key) || !isAllowedValue(value)) {
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

function isAllowedValue(value: unknown): value is SanitizedMetadataValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
