import { Injectable } from '@nestjs/common';

import { CacheService, CacheStats } from './cache.service';

/**
 * Disabled cache (the default when `VALKEY_URL` is not configured). Every read
 * is a miss and writes are no-ops, so the system serves entirely from the
 * database. TTL is still validated so callers cannot rely on permanent keys.
 */
@Injectable()
export class NoopCacheService extends CacheService {
  readonly enabled = false;

  private misses = 0;

  async get<T>(_key: string): Promise<T | null> {
    this.misses += 1;
    return null;
  }

  async set<T>(_key: string, _value: T, ttlSeconds: number): Promise<void> {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('cache set requires a positive TTL (seconds).');
    }
  }

  async del(_key: string): Promise<void> {
    // no-op
  }

  async delByPrefix(_prefix: string): Promise<number> {
    return 0;
  }

  stats(): CacheStats {
    return { hits: 0, misses: this.misses, errors: 0 };
  }
}
