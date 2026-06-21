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
import { FieldMappingsController } from '../controllers/field-mappings.controller';
import { FieldMappingTargetType } from '../schemas/field-mapping.constants';
import { FieldMappingsService } from '../services/field-mappings.service';

describe('FieldMappingsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  const tenantId = '662d4f6e7a1c2b00124f0001';
  const mappingId = '662d4f6e7a1c2b00124f0601';
  const actorId = '662d4f6e7a1c2b00124f0999';
  let app: INestApplication;
  let baseUrl: string;
  let fieldMappingsService: {
    create: jest.Mock;
    findByFilters: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  beforeAll(async () => {
    const mappingResponse = {
      id: mappingId,
      tenantId,
      datasetKey: 'sales',
      sourcePath: 'order.total',
      targetField: 'totalAmount',
      targetType: FieldMappingTargetType.Money,
      required: true,
      status: 'active',
      createdAt: '2026-04-26T12:00:00.000Z',
      updatedAt: '2026-04-26T12:00:00.000Z',
    };
    fieldMappingsService = {
      create: jest.fn(async () => mappingResponse),
      findByFilters: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
      })),
      update: jest.fn(async () => mappingResponse),
      deactivate: jest.fn(async () => ({ ...mappingResponse, status: 'inactive' })),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [FieldMappingsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: FieldMappingsService,
          useValue: fieldMappingsService,
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
    fieldMappingsService.create.mockClear();
    fieldMappingsService.findByFilters.mockClear();
    fieldMappingsService.deactivate.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires admin key for the list endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/field-mappings?tenantId=${tenantId}`);
    const body = await readJsonRecord(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
  });

  it('rejects insufficient role on the create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/field-mappings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId,
        datasetKey: 'sales',
        sourcePath: 'order.total',
        targetField: 'totalAmount',
        targetType: FieldMappingTargetType.Money,
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ statusCode: 403, error: 'Forbidden', message: 'Forbidden.' });
    expect(fieldMappingsService.create).not.toHaveBeenCalled();
  });

  it('rejects insufficient role on the deactivate endpoint', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/field-mappings/${mappingId}?tenantId=${tenantId}`,
      {
        method: 'DELETE',
        headers: {
          [DELFOS_ADMIN_KEY_HEADER]: adminKey,
          [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(fieldMappingsService.deactivate).not.toHaveBeenCalled();
  });

  it('returns a standardized validation error when tenantId is missing on list', async () => {
    const response = await fetch(`${baseUrl}/api/v1/field-mappings`, {
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

  it('creates a field mapping and forwards the actor context', async () => {
    const response = await fetch(`${baseUrl}/api/v1/field-mappings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
        [DELFOS_ACTOR_ID_HEADER]: actorId,
      },
      body: JSON.stringify({
        tenantId,
        datasetKey: 'sales',
        sourcePath: 'order.total',
        targetField: 'totalAmount',
        targetType: FieldMappingTargetType.Money,
      }),
    });

    expect(response.status).toBe(201);
    expect(fieldMappingsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId }),
      { actorId },
    );
  });

  it('scopes the list endpoint to the requested tenant', async () => {
    const response = await fetch(`${baseUrl}/api/v1/field-mappings?tenantId=${tenantId}`, {
      headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
    });

    expect(response.status).toBe(200);
    expect(fieldMappingsService.findByFilters).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId }),
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
