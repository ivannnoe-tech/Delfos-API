import { Body, Controller, Get, INestApplication, Post, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { IsMongoId } from 'class-validator';

import { AppConfigService } from '../../../config/app-config.service';
import { AdminRoles } from '../../../modules/auth/decorators/admin-roles.decorator';
import {
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
} from '../../../modules/auth/constants/auth-headers';
import { AdminKeyGuard } from '../../../modules/auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../../modules/auth/guards/admin-roles.guard';
import { RequestAuthContextService } from '../../../modules/auth/services/request-auth-context.service';
import { AdminRole } from '../../../modules/auth/types/admin-role';
import { RequestContextInterceptor } from '../../interceptors/request-context.interceptor';
import { createApiValidationPipe } from '../../pipes/api-validation.pipe';
import { ApiErrorDetail, ApiErrorResponse } from '../../errors/api-error-response';
import { HttpExceptionFilter } from '../http-exception.filter';

class TestValidationDto {
  @IsMongoId()
  tenantId!: string;
}

@Controller('test-errors')
class TestErrorContractController {
  @Post('validation')
  validate(@Body() dto: TestValidationDto): TestValidationDto {
    return dto;
  }

  @Get('admin')
  @UseGuards(AdminKeyGuard)
  adminRead(): { ok: true } {
    return { ok: true };
  }

  @Post('admin-write')
  @UseGuards(AdminKeyGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.Admin)
  adminWrite(): { ok: true } {
    return { ok: true };
  }

  @Get('unexpected')
  unexpected(): never {
    throw new Error('database secret leaked through unexpected error');
  }
}

describe('API error contract', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestErrorContractController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
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

  it('returns a structured 400 validation error', async () => {
    const response = await fetch(`${baseUrl}/test-errors/validation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'invalid' }),
    });
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      path: '/test-errors/validation',
      method: 'POST',
    });
    expect(body.details).toHaveLength(1);
    expect(body.details?.[0]?.field).toBe('tenantId');
    expect(body.details?.[0]?.message).toContain('tenantId');
    expectRequestContext(body);
  });

  it('returns a structured 401 when admin key is missing', async () => {
    const response = await fetch(`${baseUrl}/test-errors/admin`);
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
      path: '/test-errors/admin',
      method: 'GET',
    });
    expectRequestContext(body);
  });

  it('returns a structured 401 when admin key is invalid', async () => {
    const response = await fetch(`${baseUrl}/test-errors/admin`, {
      headers: {
        [DELFOS_ADMIN_KEY_HEADER]: 'wrong-admin-key-not-a-real-secret',
      },
    });
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    expectRequestContext(body);
  });

  it('returns a structured 403 when role is insufficient', async () => {
    const response = await fetch(`${baseUrl}/test-errors/admin-write`, {
      method: 'POST',
      headers: {
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
    });
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden.',
      path: '/test-errors/admin-write',
      method: 'POST',
    });
    expectRequestContext(body);
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/missing-route`);
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/missing-route',
      method: 'GET',
    });
    expectRequestContext(body);
  });

  it('returns a sanitized 500 without leaking internals', async () => {
    const response = await fetch(`${baseUrl}/test-errors/unexpected`);
    const body = await readApiErrorResponse(response);

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Unexpected error.',
      path: '/test-errors/unexpected',
      method: 'GET',
    });
    expect(JSON.stringify(body)).not.toContain('database secret leaked');
    expect(JSON.stringify(body)).not.toContain('stack');
    expectRequestContext(body);
  });
});

async function readApiErrorResponse(response: Response): Promise<ApiErrorResponse> {
  const body: unknown = await response.json();

  if (!isApiErrorResponse(body)) {
    throw new Error('Response body does not match ApiErrorResponse.');
  }

  return body;
}

function expectRequestContext(body: ApiErrorResponse): void {
  expect(body.requestId).toEqual(expect.any(String));
  expect(body.correlationId).toEqual(expect.any(String));
  expect(body.timestamp).toEqual(expect.any(String));
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.statusCode === 'number' &&
    typeof value.error === 'string' &&
    typeof value.message === 'string' &&
    typeof value.requestId === 'string' &&
    typeof value.correlationId === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.path === 'string' &&
    typeof value.method === 'string' &&
    (value.details === undefined || isApiErrorDetails(value.details))
  );
}

function isApiErrorDetails(value: unknown): value is ApiErrorDetail[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        (item.field === undefined || typeof item.field === 'string') &&
        typeof item.message === 'string',
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
