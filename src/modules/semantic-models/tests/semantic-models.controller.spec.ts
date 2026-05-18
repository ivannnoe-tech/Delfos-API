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
import { SemanticModelsController } from '../controllers/semantic-models.controller';
import { SemanticModelsService } from '../services/semantic-models.service';

describe('SemanticModelsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  let app: INestApplication;
  let baseUrl: string;
  let semanticModelsService: Pick<
    SemanticModelsService,
    'create' | 'findByFilters' | 'findOne' | 'update' | 'archive'
  >;

  beforeAll(async () => {
    semanticModelsService = {
      create: jest.fn(async () => createSemanticModelResponse()),
      findByFilters: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      })),
      findOne: jest.fn(async () => createSemanticModelResponse()),
      update: jest.fn(async () => createSemanticModelResponse()),
      archive: jest.fn(async () => createSemanticModelResponse({ status: 'archived' })),
    } as unknown as Pick<
      SemanticModelsService,
      'create' | 'findByFilters' | 'findOne' | 'update' | 'archive'
    >;
    const moduleRef = await Test.createTestingModule({
      controllers: [SemanticModelsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: SemanticModelsService,
          useValue: semanticModelsService,
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
      `${baseUrl}/api/v1/semantic-models?tenantId=662d4f6e7a1c2b00124f0001`,
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
    const response = await fetch(`${baseUrl}/api/v1/semantic-models`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        modelKey: 'comercial_semantico',
        name: 'Modelo semantico comercial',
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
    const response = await fetch(`${baseUrl}/api/v1/semantic-models`, {
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

  it('creates a semantic model without returning sensitive metadata from response mock', async () => {
    const response = await fetch(`${baseUrl}/api/v1/semantic-models`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        tenantId: '662d4f6e7a1c2b00124f0001',
        modelKey: 'comercial_semantico',
        name: 'Modelo semantico comercial',
        metadata: { token: 'must-not-leak', domain: 'sales' },
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(201);
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });
});

function createSemanticModelResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: '662d4f6e7a1c2b00124f0901',
    tenantId: '662d4f6e7a1c2b00124f0001',
    modelKey: 'comercial_semantico',
    name: 'Modelo semantico comercial',
    status: 'draft',
    datasetKeys: [],
    tags: ['comercial'],
    quality: { warnings: [] },
    measures: [],
    dimensions: [],
    glossaryTerms: [],
    metadata: { domain: 'sales' },
    settings: {},
    createdAt: '2026-05-17T12:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
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
