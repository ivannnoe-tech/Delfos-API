import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Kysely } from 'kysely';

import { AppConfigService } from '../../config/app-config.service';
import { DB } from './database.types';
import { KYSELY_DB } from './postgres.constants';
import { PostgresHealthService } from './postgres-health.service';
import { createKysely } from './postgres.provider';

/**
 * Global PostgreSQL module (ADR-0035 / ADR-0036).
 *
 * Provides the shared `Kysely<DB>` instance under {@link KYSELY_DB}, plus
 * {@link PostgresHealthService}. PostgreSQL is the sole database since P5
 * (ADR-0035); `DELFOS_POSTGRES_URL` is required at bootstrap. The legacy
 * nullable provider shape is retained for the health/seed consumers that still
 * type the injection as `Kysely<DB> | null`.
 */
@Global()
@Module({
  providers: [
    {
      provide: KYSELY_DB,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Kysely<DB> | null => createKysely(config.postgresUrl),
    },
    PostgresHealthService,
  ],
  exports: [KYSELY_DB, PostgresHealthService],
})
export class PostgresModule implements OnModuleDestroy {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB> | null) {}

  async onModuleDestroy(): Promise<void> {
    await this.db?.destroy();
  }
}
