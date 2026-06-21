import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import Valkey from 'iovalkey';

import { AppConfigService } from '../../config/app-config.service';
import { CacheService } from './cache.service';
import { NoopCacheService } from './noop-cache.service';
import { ValkeyCacheService, ValkeyClient } from './valkey-cache.service';

const VALKEY_CLIENT = Symbol('VALKEY_CLIENT');

/**
 * Global cache module (ADR-0035 / valkey-cache-plan.md, phase P6).
 *
 * Provides {@link CacheService}: a {@link ValkeyCacheService} when `VALKEY_URL`
 * is configured, otherwise a {@link NoopCacheService} (cache disabled — the
 * system serves from the database). The cache is never a critical dependency:
 * the Valkey client fails fast and errors are swallowed by the service.
 */
@Global()
@Module({
  providers: [
    {
      provide: VALKEY_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): ValkeyClient | null => {
        if (!config.valkeyUrl) {
          return null;
        }
        const logger = new Logger('CacheModule');
        const client = new Valkey(config.valkeyUrl, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: false,
        });
        client.on('error', (error: Error) => {
          logger.warn(`Valkey connection error: ${error.message}`);
        });
        return client;
      },
    },
    {
      provide: CacheService,
      inject: [VALKEY_CLIENT],
      useFactory: (client: ValkeyClient | null): CacheService =>
        client ? new ValkeyCacheService(client) : new NoopCacheService(),
    },
  ],
  exports: [CacheService],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(VALKEY_CLIENT) private readonly client: ValkeyClient | null) {}

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // best-effort shutdown; the client may already be disconnected.
      }
    }
  }
}
