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
import { ExecutionRequestsController } from '../controllers/execution-requests.controller';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestsService } from '../services/execution-requests.service';

const tenantId = '662d4f6e7a1c2b00124f0001';
const executionRequestId = '662d4f6e7a1c2b00124f0901';
const queryDefinitionId = '662d4f6e7a1c2b00124f0601';

describe('ExecutionRequestsController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  let app: INestApplication;
  let baseUrl: string;
  let executionRequestsService: Pick<
    ExecutionRequestsService,
    'create' | 'findByFilters' | 'findOne'
  >;

  beforeAll(async () => {
    executionRequestsService = {
      create: jest.fn(async () => createExecutionRequestResponse()),
      findByFilters: jest.fn(async () => ({
        items: [createExecutionRequestResponse()],
        meta: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      })),
      findOne: jest.fn(async () => createExecutionRequestResponse()),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ExecutionRequestsController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: ExecutionRequestsService,
          useValue: executionRequestsService,
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
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires auth for list endpoint', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/runtime/execution-requests?tenantId=${tenantId}`,
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
  });

  it('allows read and list with admin key and explicit tenant scope', async () => {
    const listResponse = await fetch(
      `${baseUrl}/api/v1/runtime/execution-requests?tenantId=${tenantId}`,
      {
        headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
      },
    );
    const readResponse = await fetch(
      `${baseUrl}/api/v1/runtime/execution-requests/${executionRequestId}?tenantId=${tenantId}`,
      {
        headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
      },
    );

    expect(listResponse.status).toBe(200);
    expect(readResponse.status).toBe(200);
    expect(executionRequestsService.findByFilters).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId }),
    );
    expect(executionRequestsService.findOne).toHaveBeenCalledWith(tenantId, executionRequestId);
  });

  it('rejects viewer role on create endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/runtime/execution-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
      },
      body: JSON.stringify({
        tenantId,
        kind: ExecutionRequestKind.Query,
        queryDefinitionId,
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden.',
    });
    expect(executionRequestsService.create).not.toHaveBeenCalled();
  });

  it.each([AdminRole.Owner, AdminRole.Admin, AdminRole.Operator])(
    'allows %s role to create an execution request foundation record',
    async (role) => {
      const response = await fetch(`${baseUrl}/api/v1/runtime/execution-requests`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [DELFOS_ADMIN_KEY_HEADER]: adminKey,
          [DELFOS_ACTOR_ID_HEADER]: 'dev-actor-001',
          [DELFOS_ACTOR_ROLE_HEADER]: role,
        },
        body: JSON.stringify({
          tenantId,
          kind: ExecutionRequestKind.Query,
          queryDefinitionId,
          metadata: { domain: 'sales' },
        }),
      });
      const body = await readJsonRecord(response);

      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        kind: ExecutionRequestKind.Query,
        status: ExecutionRequestStatus.Accepted,
        message: 'Runtime foundation request accepted. No real execution was started.',
      });
      expect(executionRequestsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          kind: ExecutionRequestKind.Query,
          queryDefinitionId,
          metadata: { domain: 'sales' },
        }),
        { actorId: 'dev-actor-001', actorRole: role },
      );
    },
  );

  it('returns standardized validation error when tenantId is missing', async () => {
    const response = await fetch(`${baseUrl}/api/v1/runtime/execution-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        kind: ExecutionRequestKind.Query,
        queryDefinitionId,
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });
    expect(JSON.stringify(body)).toContain('tenantId');
    expect(JSON.stringify(body)).not.toContain(adminKey);
    expect(executionRequestsService.create).not.toHaveBeenCalled();
  });

  it('rejects sensitive or operational fields that are not part of the contract', async () => {
    const response = await fetch(`${baseUrl}/api/v1/runtime/execution-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
      },
      body: JSON.stringify({
        tenantId,
        kind: ExecutionRequestKind.Query,
        queryDefinitionId,
        secretValue: 'must-not-be-accepted',
        filters: { authorization: 'Bearer must-not-leak' },
        settings: { token: 'must-not-leak' },
      }),
    });
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });
    expect(executionRequestsService.create).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toContain('must-not-be-accepted');
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });
});

function createExecutionRequestResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: executionRequestId,
    tenantId,
    requestKey: `exec_req_${executionRequestId}`,
    kind: ExecutionRequestKind.Query,
    status: ExecutionRequestStatus.Accepted,
    queryDefinitionId,
    mode: ExecutionRequestMode.FutureRuntime,
    reason: 'runtime_foundation_only',
    message: 'Runtime foundation request accepted. No real execution was started.',
    metadata: { domain: 'sales' },
    createdAt: '2026-05-02T12:00:00.000Z',
    updatedAt: '2026-05-02T12:00:00.000Z',
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
