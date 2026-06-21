/**
 * Cache key namespacing (ADR-0035 / valkey-cache-plan.md §4).
 *
 * Every key is `delfos:{env}:tenant:{tenantId}:{namespace}:{...parts}`. The
 * `env` and `tenantId` segments are MANDATORY — there are no cross-tenant keys
 * and no global tenant-scoped data. Building a key without a tenant throws.
 */
export type CacheNamespace =
  | 'catalog'
  | 'runtime'
  | 'idempotency'
  | 'lock'
  | 'ratelimit'
  | 'metadata';

export interface CacheKeyParams {
  env: string;
  tenantId: string;
  namespace: CacheNamespace;
  parts: Array<string | number>;
}

function sanitizeSegment(value: string | number): string {
  const text = String(value).trim();
  // Keep keys unambiguous: collapse anything outside a safe set (notably ':').
  return text.replace(/[^A-Za-z0-9._-]/g, '_');
}

export function buildCacheKey({ env, tenantId, namespace, parts }: CacheKeyParams): string {
  if (!env || !env.trim()) {
    throw new Error('cache key requires an env label.');
  }
  if (!tenantId || !tenantId.trim()) {
    throw new Error('cache key requires a tenantId (no cross-tenant keys).');
  }
  if (parts.length === 0) {
    throw new Error('cache key requires at least one identifying part.');
  }

  const tail = parts.map(sanitizeSegment).join(':');
  return `delfos:${sanitizeSegment(env)}:tenant:${sanitizeSegment(tenantId)}:${namespace}:${tail}`;
}

/**
 * Prefix for a tenant's keys, usable with `CacheService.delByPrefix` (SCAN-based).
 * Restricted to a single tenant (and optionally a namespace) — never a global
 * wildcard.
 */
export function buildCacheTenantPrefix(
  env: string,
  tenantId: string,
  namespace?: CacheNamespace,
): string {
  if (!tenantId || !tenantId.trim()) {
    throw new Error('cache prefix requires a tenantId (no cross-tenant scans).');
  }
  const base = `delfos:${sanitizeSegment(env)}:tenant:${sanitizeSegment(tenantId)}`;
  return namespace ? `${base}:${namespace}:` : `${base}:`;
}
