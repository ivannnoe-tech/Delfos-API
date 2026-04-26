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
import { DashboardDefinitionsController } from '../controllers/dashboard-definitions.controller';
import { DashboardDefinitionsService } from '../services/dashboard-definitions.service';

describe('DashboardDefinitionsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  let app: INestApplication;
  let baseUrl: string;
  let dashboardDefinitionsService: Pick<
    DashboardDefinitionsService,
    'create' | 'findByFilters' | 'findOne' | 'update' | 'archive'
  >;

  beforeAll(async () => {
    dashboardDefinitionsService = {
      create: jest.fn(async () => createDashboardDefinitionResponse()),
      findByFilters: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      })),
      findOne: jest.fn(async () => createDashboardDefinitionResponse()),
      update: jest.fn(async () => createDashboardDefinitionResponse()),
      archive: jest.fn(async () => createDashboardDefinitionResponse({ status: 'archived' })),
    } as unknown as Pick<
      DashboardDefinitionsService,
      'create' | 'findByFilters' | 'findOne' | 'update' | 'archive'
    >;
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardDefinitionsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: DashboardDefinitionsService,
          useValue: dashboardDefinitionsService,
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
      `${baseUrl}/api/v1/dashboard-definitions?tenantId=662d4f6e7a1c2b00124f0001`,
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
    const response = await fetch(`${baseUrl}/api/v1/dashboard-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        dashboardKey: 'sales_dashboard',
        name: 'Dashboard de vendas',
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
    const response = await fetch(`${baseUrl}/api/v1/dashboard-definitions`, {
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

  it('requires tenantId on create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/dashboard-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        dashboardKey: 'sales_dashboard',
        name: 'Dashboard de vendas',
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).toContain('tenantId');
  });

  it('creates dashboard definition without returning sensitive metadata from response mock', async () => {
    const response = await fetch(`${baseUrl}/api/v1/dashboard-definitions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        dashboardKey: 'sales_dashboard',
        name: 'Dashboard de vendas',
        metadata: { token: 'must-not-leak', domain: 'sales' },
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(201);
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });
});

function createDashboardDefinitionResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: '662d4f6e7a1c2b00124f0701',
    tenantId: '662d4f6e7a1c2b00124f0001',
    dashboardKey: 'sales_dashboard',
    name: 'Dashboard de vendas',
    status: 'draft',
    visibility: 'tenant',
    layout: { type: 'grid', columns: 12 },
    sections: [],
    widgets: [],
    filters: [],
    tags: ['sales'],
    metadata: { domain: 'sales' },
    settings: {},
    createdAt: '2026-04-26T12:00:00.000Z',
    updatedAt: '2026-04-26T12:00:00.000Z',
    ...overrides,
  };
}

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
