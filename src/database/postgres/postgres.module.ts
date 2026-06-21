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
 * Provides the shared `Kysely<DB>` instance (or `null` when Postgres is not
 * configured) under {@link KYSELY_DB}, plus {@link PostgresHealthService}.
 * MongoDB remains the operational database until phase P5 of the migration.
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
