import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';

import { DB } from './database.types';
import { KYSELY_DB } from './postgres.constants';

export type PostgresHealthStatus = 'up' | 'down' | 'disabled';

export interface PostgresHealth {
  status: PostgresHealthStatus;
  latencyMs?: number;
  error?: string;
}

/**
 * Lightweight PostgreSQL connectivity probe (ADR-0035 P1).
 *
 * `disabled` — no `DELFOS_POSTGRES_URL` configured (API runs on MongoDB only).
 * `up` — `select 1` succeeded; `latencyMs` reports the round-trip.
 * `down` — the probe failed; `error` carries the reason (no secrets).
 */
@Injectable()
export class PostgresHealthService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB> | null) {}

  async check(): Promise<PostgresHealth> {
    if (!this.db) {
      return { status: 'disabled' };
    }

    const start = Date.now();

    try {
      await sql`select 1`.execute(this.db);
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }
}
