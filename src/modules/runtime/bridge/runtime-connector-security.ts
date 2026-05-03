const FORBIDDEN_FIELD_FRAGMENTS = [
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'clientsecret',
  'privatekey',
  'apikey',
  'authorization',
  'cookie',
  'setcookie',
  'connectionstring',
  'rawerror',
  'rawresponse',
  'rawpayload',
  'stacktrace',
  'protectedsecretvalue',
] as const;

const SUSPICIOUS_VALUE_PATTERNS = [
  /\b(password|token|secret|private[_\s-]?key|api[_\s-]?key|client[_\s-]?secret)\b/i,
  /\b(password|pwd|token|secret|api[_-]?key|authorization)\s*[:=]/i,
  /\b(bearer|basic)\s+[a-z0-9._~+/=-]{12,}/i,
  /\b(server|data source|host|user id|uid)\s*=[^;]+;.*\b(password|pwd)\s*=/i,
  /\b(postgres|postgresql|mysql|mongodb|sqlserver|mssql):\/\/\S+/i,
];

export interface RuntimeConnectorForbiddenFieldFinding {
  readonly path: string;
  readonly field: string;
}

export function normalizeRuntimeConnectorFieldName(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function isRuntimeConnectorForbiddenFieldName(value: string): boolean {
  const normalized = normalizeRuntimeConnectorFieldName(value);

  return FORBIDDEN_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function isRuntimeConnectorSuspiciousValue(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    SUSPICIOUS_VALUE_PATTERNS.some((pattern) => pattern.test(value.trim()))
  );
}

export function isRuntimeConnectorSuspiciousCredentialRef(value: string): boolean {
  return (
    isRuntimeConnectorSuspiciousValue(value) ||
    /\b(password|token|secret|private[_-]?key|api[_-]?key|bearer|authorization)\b/i.test(value)
  );
}

export function isRuntimeConnectorSuspiciousConnectionId(value: string): boolean {
  return (
    isRuntimeConnectorSuspiciousValue(value) ||
    /\b(connection[_-]?string|server=|data source=|trusted_connection=|database=)\b/i.test(value)
  );
}

export function findRuntimeConnectorForbiddenFields(
  input: unknown,
  basePath = '$',
): RuntimeConnectorForbiddenFieldFinding[] {
  const findings: RuntimeConnectorForbiddenFieldFinding[] = [];
  const seen = new WeakSet<object>();

  function visit(value: unknown, path: string): void {
    if (value === null || typeof value !== 'object') {
      return;
    }

    if (seen.has(value)) {
      return;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      const nestedPath = `${path}.${key}`;

      if (isRuntimeConnectorForbiddenFieldName(key)) {
        findings.push({ path: nestedPath, field: key });
        return;
      }

      visit(nestedValue, nestedPath);
    });
  }

  visit(input, basePath);
  return findings;
}

export function containsRuntimeConnectorSuspiciousValue(input: unknown): boolean {
  const seen = new WeakSet<object>();

  function visit(value: unknown): boolean {
    if (isRuntimeConnectorSuspiciousValue(value)) {
      return true;
    }

    if (value === null || typeof value !== 'object') {
      return false;
    }

    if (seen.has(value)) {
      return false;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.some((item) => visit(item));
    }

    return Object.values(value as Record<string, unknown>).some((nestedValue) =>
      visit(nestedValue),
    );
  }

  return visit(input);
}
