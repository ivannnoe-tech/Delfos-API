import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AppConfigService } from '../../../config/app-config.service';
import { HttpExceptionFilter } from '../../../core/filters/http-exception.filter';
import { RequestContextInterceptor } from '../../../core/interceptors/request-context.interceptor';
import { createApiValidationPipe } from '../../../core/pipes/api-validation.pipe';
import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
} from '../../auth/constants/auth-headers';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { RequestAuthContextService } from '../../auth/services/request-auth-context.service';
import { AdminRole } from '../../auth/types/admin-role';
import { ConnectionsController } from '../controllers/connections.controller';
import { ConnectionsService } from '../services/connections.service';

describe('ConnectionsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  const tenantId = '662d4f6e7a1c2b00124f0001';
  const actorId = '662d4f6e7a1c2b00124f0999';
  let app: INestApplication;
  let baseUrl: string;
  let connectionsService: {
    create: jest.Mock;
    findByTenant: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeAll(async () => {
    connectionsService = {
      create: jest.fn(async () => ({
        id: '662d4f6e7a1c2b00124f0501',
        tenantId,
        name: 'Primary customer API',
        type: 'customer_api',
        baseUrl: 'https://api.customer.example',
        authType: 'bearer_token',
        hasCredentialReference: true,
        allowedHeaders: [],
        metadata: { environment: 'sandbox' },
        status: 'draft',
        createdAt: '2026-04-26T12:00:00.000Z',
        updatedAt: '2026-04-26T12:00:00.000Z',
      })),
      findByTenant: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      })),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ConnectionsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: ConnectionsService,
          useValue: connectionsService,
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

  afterEach(() => {
    connectionsService.create.mockClear();
    connectionsService.findByTenant.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires admin key for the list endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/connections?tenantId=${tenantId}`);
    const body = await readJsonRecord(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
  });

  it('rejects insufficient role on the create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/connections`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId,
        name: 'Primary customer API',
        baseUrl: 'https://api.customer.example',
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ statusCode: 403, error: 'Forbidden', message: 'Forbidden.' });
    expect(connectionsService.create).not.toHaveBeenCalled();
  });

  it('returns a standardized validation error when tenantId is missing on list', async () => {
    const response = await fetch(`${baseUrl}/api/v1/connections`, {
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

  it('creates a connection, forwards actor context, and does not echo raw request secrets', async () => {
    const response = await fetch(`${baseUrl}/api/v1/connections`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
        [DELFOS_ACTOR_ID_HEADER]: actorId,
      },
      body: JSON.stringify({
        tenantId,
        name: 'Primary customer API',
        baseUrl: 'https://api.customer.example',
        credentialRef: 'vault-reference',
        metadata: { environment: 'sandbox', accessToken: 'must-not-leak' },
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(201);
    expect(connectionsService.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId }), {
      actorId,
    });
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });

  it('scopes the list endpoint to the requested tenant', async () => {
    const response = await fetch(`${baseUrl}/api/v1/connections?tenantId=${tenantId}`, {
      headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
    });

    expect(response.status).toBe(200);
    expect(connectionsService.findByTenant).toHaveBeenCalledWith(
      tenantId,
      expect.any(Number),
      expect.any(Number),
    );
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
