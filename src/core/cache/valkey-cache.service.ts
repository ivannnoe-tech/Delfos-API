import { Injectable, Logger } from '@nestjs/common';

import { CacheService, CacheStats } from './cache.service';

/**
 * Minimal subset of the iovalkey/ioredis client used by the cache. Declared as
 * an interface so the service is fully unit-testable with a fake client.
 */
export interface ValkeyClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  scan(
    cursor: string,
    matchToken: 'MATCH',
    pattern: string,
    countToken: 'COUNT',
    count: number,
  ): Promise<[string, string[]]>;
  quit(): Promise<unknown>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

/**
 * Valkey-backed cache (ADR-0035 / valkey-cache-plan.md). Best-effort: backend
 * failures are swallowed and surfaced as misses/no-ops so callers fall back to
 * the database (the cache is never a critical dependency). Values are never
 * logged. TTL is mandatory on every write.
 */
@Injectable()
export class ValkeyCacheService extends CacheService {
  readonly enabled = true;

  private readonly logger = new Logger(ValkeyCacheService.name);
  private hits = 0;
  private misses = 0;
  private errors = 0;

  constructor(private readonly client: ValkeyClient) {
    super();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (raw === null) {
        this.misses += 1;
        return null;
      }
      this.hits += 1;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.errors += 1;
      this.logger.warn(`cache get failed for key ${key}: ${errorMessage(error)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('cache set requires a positive TTL (seconds).');
    }
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', Math.floor(ttlSeconds));
    } catch (error) {
      this.errors += 1;
      this.logger.warn(`cache set failed for key ${key}: ${errorMessage(error)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.errors += 1;
      this.logger.warn(`cache del failed for key ${key}: ${errorMessage(error)}`);
    }
  }

  async delByPrefix(prefix: string): Promise<number> {
    let cursor = '0';
    let removed = 0;
    try {
      do {
        const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
        cursor = next;
        if (keys.length > 0) {
          removed += await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.errors += 1;
      this.logger.warn(`cache delByPrefix failed for ${prefix}: ${errorMessage(error)}`);
    }
    return removed;
  }

  stats(): CacheStats {
    return { hits: this.hits, misses: this.misses, errors: this.errors };
  }
}
