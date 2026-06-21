import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { resolveCorsOptions } from '../../../src/config/cors.config';
import { HttpExceptionFilter } from '../../../src/core/filters/http-exception.filter';
import { RequestContextInterceptor } from '../../../src/core/interceptors/request-context.interceptor';
import { createApiValidationPipe } from '../../../src/core/pipes/api-validation.pipe';
import {
  EphemeralDb,
  provisionEphemeralDb,
} from '../../../src/database/postgres/tests/ephemeral-db';

/**
 * Foundation E2E harness. Boots the real AppModule with the exact global
 * middleware applied by src/main.ts. No production database, no real secrets,
 * no connector execution.
 *
 * Backend (since P5, ADR-0035): PostgreSQL only. A fresh ephemeral PostgreSQL
 * database is provisioned per run, migrated to latest, and exposed via
 * `DELFOS_POSTGRES_URL`. `E2E_POSTGRES_URL` (the base server URL) is therefore
 * required — the harness fails fast when it is absent.
 */
export const E2E_ADMIN_KEY = 'e2e-foundation-admin-key-not-a-real-secret';

/** Base PostgreSQL server URL for the ephemeral E2E database, or `undefined`. */
export const E2E_POSTGRES_BASE_URL = normalizeBaseUrl(process.env.E2E_POSTGRES_URL);

/** Always true since P5: the E2E suite runs against PostgreSQL (drives id encoding). */
export const E2E_ON_POSTGRES = true;

// Fixed isolation tenant/actor as UUIDs for the Postgres path. Must mirror the
// ids exported by `e2e-client.ts`; kept here so the harness can seed the tenant
// row (its FK target) before any spec runs.
const E2E_PG_TENANT_ID = '662d4f6e-7a1c-4b00-8a4f-000000000001';

// 32 bytes encoded as base64; only satisfies the AES key length check.
const E2E_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');

export interface E2EApp {
  readonly baseUrl: string;
  close(): Promise<void>;
}

export interface StartE2EAppOptions {
  /**
   * Allowed CORS origins (CSV), mirroring the `CORS_ORIGIN` env var. When
   * provided, the harness applies `enableCors` exactly as `src/main.ts` does
   * so CORS behaviour can be asserted end-to-end. Defaults to disabled CORS.
   */
  readonly corsOrigin?: string;
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Seed the isolation tenant directly so every tenant-scoped insert satisfies the
 * `tenant_id → tenants(id)` foreign key. Inserts the tenant with a fixed UUID
 * primary key matching `E2E_TENANT_ID`; idempotent within a fresh database.
 */
async function seedE2ETenant(ephemeral: EphemeralDb): Promise<void> {
  await ephemeral.db
    .insertInto('tenants')
    .values({
      id: E2E_PG_TENANT_ID,
      name: 'E2E Foundation Tenant',
      slug: 'e2e-foundation-tenant',
      status: 'active',
      settings: JSON.stringify({ environment: 'test', demo: true }),
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

export async function startE2EApp(options: StartE2EAppOptions = {}): Promise<E2EApp> {
  if (!E2E_POSTGRES_BASE_URL) {
    throw new Error(
      'E2E requires PostgreSQL since P5 (ADR-0035): set E2E_POSTGRES_URL to a base server URL.',
    );
  }

  const ephemeral = await provisionEphemeralDb(E2E_POSTGRES_BASE_URL, 'e2e');
  await seedE2ETenant(ephemeral);

  // Env must be set BEFORE AppModule is imported: ConfigModule.forRoot reads
  // process.env eagerly, so AppModule is loaded lazily here, not at file top.
  process.env.NODE_ENV = 'test';
  process.env.DELFOS_POSTGRES_URL = ephemeral.url;
  process.env.DELFOS_ADMIN_KEY = E2E_ADMIN_KEY;
  process.env.ENCRYPTION_KEY_BASE64 = E2E_ENCRYPTION_KEY;
  process.env.SWAGGER_ENABLED = 'false';
  process.env.CORS_ORIGIN = options.corsOrigin ?? '';

  const { AppModule } = await import('../../../src/app.module');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  const corsOrigins = (options.corsOrigin ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  app.enableCors(resolveCorsOptions(corsOrigins, 'test'));
  app.useGlobalPipes(createApiValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());
  await app.listen(0);
  const baseUrl = await app.getUrl();

  return {
    baseUrl,
    close: async (): Promise<void> => {
      await app.close();
      await ephemeral.cleanup();
    },
  };
}
