import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AppConfigService } from '../../../config/app-config.service';
import { HttpExceptionFilter } from '../../../core/filters/http-exception.filter';
import { RequestContextInterceptor } from '../../../core/interceptors/request-context.interceptor';
import { createApiValidationPipe } from '../../../core/pipes/api-validation.pipe';
import {
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
} from '../../auth/constants/auth-headers';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { RequestAuthContextService } from '../../auth/services/request-auth-context.service';
import { AdminRole } from '../../auth/types/admin-role';
import { QueryDefinitionsController } from '../controllers/query-definitions.controller';
import { QueryDefinitionsService } from '../services/query-definitions.service';

describe('QueryDefinitionsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  let app: INestApplication;
  let baseUrl: string;
  let queryDefinitionsService: Pick<QueryDefinitionsService, 'create' | 'findByFilters'>;

  beforeAll(async () => {
    queryDefinitionsService = {
      create: jest.fn(async () => ({
        id: '662d4f6e7a1c2b00124f0601',
        tenantId: '662d4f6e7a1c2b00124f0001',
        datasetId: '662d4f6e7a1c2b00124f0501',
        queryKey: 'sales_overview',
        name: 'Visao geral de vendas',
        status: 'draft',
        type: 'metric',
        metrics: [],
        dimensions: [],
        filters: [],
        sorts: [],
        allowedGranularities: [],
        tags: ['sales'],
        metadata: { domain: 'sales' },
        settings: {},
        createdAt: '2026-04-26T12:00:00.000Z',
        updatedAt: '2026-04-26T12:00:00.000Z',
      })),
      findByFilters: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      })),
    } as unknown as Pick<QueryDefinitionsService, 'create' | 'findByFilters'>;
    const moduleRef = await Test.createTestingModule({
      controllers: [QueryDefinitionsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: QueryDefinitionsService,
          useValue: queryDefinitionsService,
        },
        {
          provide: AppConfigService,
          useValue: {
            get adminKey(): string {
              return adminKey;
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(createApiValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new RequestContextInterceptor());
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires auth for list endpoint', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/query-definitions?tenantId=662d4f6e7a1c2b00124f0001`,
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
  });

  it('rejects insufficient role on create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/query-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        datasetId: '662d4f6e7a1c2b00124f0501',
        queryKey: 'sales_overview',
        name: 'Visao geral de vendas',
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden.',
    });
  });

  it('returns standardized validation error when tenantId is missing', async () => {
    const response = await fetch(`${baseUrl}/api/v1/query-definitions`, {
      headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });
    expect(JSON.stringify(body)).not.toContain(adminKey);
  });

  it('requires datasetId on create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/query-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        queryKey: 'sales_overview',
        name: 'Visao geral de vendas',
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).toContain('datasetId');
  });

  it('creates query definition without returning sensitive metadata from response mock', async () => {
    const response = await fetch(`${baseUrl}/api/v1/query-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        datasetId: '662d4f6e7a1c2b00124f0501',
        queryKey: 'sales_overview',
        name: 'Visao geral de vendas',
        metadata: { token: 'must-not-leak', domain: 'sales' },
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(201);
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });
});

async function readJsonRecord(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json();

  if (!isRecord(body)) {
    throw new Error('Expected JSON object response.');
  }

  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
