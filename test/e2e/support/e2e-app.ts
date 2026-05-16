import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { HttpExceptionFilter } from '../../../src/core/filters/http-exception.filter';
import { RequestContextInterceptor } from '../../../src/core/interceptors/request-context.interceptor';
import { createApiValidationPipe } from '../../../src/core/pipes/api-validation.pipe';

/**
 * Foundation E2E harness. Boots the real AppModule against an in-memory
 * MongoDB, with the exact global middleware applied by src/main.ts. No
 * production database, no real secrets, no connector execution.
 */
export const E2E_ADMIN_KEY = 'e2e-foundation-admin-key-not-a-real-secret';

// 32 bytes encoded as base64; only satisfies the AES key length check.
const E2E_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');

export interface E2EApp {
  readonly baseUrl: string;
  close(): Promise<void>;
}

export async function startE2EApp(): Promise<E2EApp> {
  const mongo = await MongoMemoryServer.create();

  // Env must be set BEFORE AppModule is imported: ConfigModule.forRoot reads
  // process.env eagerly, so AppModule is loaded lazily here, not at file top.
  process.env.NODE_ENV = 'test';
  process.env.DELFOS_DATABASE_URL = mongo.getUri('delfos_e2e');
  process.env.DELFOS_ADMIN_KEY = E2E_ADMIN_KEY;
  process.env.ENCRYPTION_KEY_BASE64 = E2E_ENCRYPTION_KEY;
  process.env.SWAGGER_ENABLED = 'false';
  process.env.CORS_ORIGIN = '';

  const { AppModule } = await import('../../../src/app.module');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  app.useGlobalPipes(createApiValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());
  await app.listen(0);
  const baseUrl = await app.getUrl();

  return {
    baseUrl,
    close: async (): Promise<void> => {
      await app.close();
      await mongo.stop();
    },
  };
}
