/**
 * Cache abstraction (ADR-0035 / valkey-cache-plan.md). The cache is always
 * derivable from the database, never a source of truth. Implemented by
 * {@link NoopCacheService} (disabled — the default) and `ValkeyCacheService`.
 *
 * Invariants enforced by the contract:
 * - every `set` requires a positive TTL (no permanent keys);
 * - keys must be built via {@link buildCacheKey} (env + tenant mandatory);
 * - the cache is best-effort: implementations must NOT throw on backend
 *   failure, so callers transparently fall back to the database.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

export abstract class CacheService {
  /** Whether a real cache backend is active (false for the no-op default). */
  abstract readonly enabled: boolean;

  abstract get<T>(key: string): Promise<T | null>;

  /** Store a value with a MANDATORY positive TTL in seconds. */
  abstract set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  abstract del(key: string): Promise<void>;

  /** Delete keys under a restricted prefix using SCAN (never a full KEYS or FLUSH). */
  abstract delByPrefix(prefix: string): Promise<number>;

  abstract stats(): CacheStats;
}
