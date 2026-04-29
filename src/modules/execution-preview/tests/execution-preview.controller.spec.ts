import { INestApplication, NotFoundException } from '@nestjs/common';
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
import { ExecutionPreviewController } from '../controllers/execution-preview.controller';
import {
  ExecutionPreviewColumnType,
  ExecutionPreviewMode,
} from '../dto/query-preview-response.dto';
import { ExecutionPreviewService } from '../services/execution-preview.service';

describe('ExecutionPreviewController', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';
  const tenantId = '662d4f6e7a1c2b00124f0001';
  const queryDefinitionId = '662d4f6e7a1c2b00124f0601';
  const dashboardDefinitionId = '662d4f6e7a1c2b00124f0701';
  let app: INestApplication;
  let baseUrl: string;
  let executionPreviewService: Pick<ExecutionPreviewService, 'previewQuery' | 'previewDashboard'>;

  beforeAll(async () => {
    executionPreviewService = {
      previewQuery: jest.fn(async () => ({
        mode: ExecutionPreviewMode.Demo,
        queryDefinitionId,
        queryKey: 'sales_overview_demo',
        generatedAt: '2026-04-26T12:00:00.000Z',
        columns: [{ key: 'period', label: 'Periodo', type: ExecutionPreviewColumnType.String }],
        rows: [{ period: 'Jan demo' }],
        meta: { rowCount: 1, isPreview: true, source: 'demo-generator' },
      })),
      previewDashboard: jest.fn(async () => ({
        mode: ExecutionPreviewMode.Demo,
        dashboardDefinitionId,
        dashboardKey: 'commercial_dashboard_demo',
        generatedAt: '2026-04-26T12:00:00.000Z',
        widgets: [],
        meta: {
          isPreview: true,
          source: 'demo-generator',
          widgetsCount: 0,
          readyWidgetsCount: 0,
        },
      })),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ExecutionPreviewController],
      providers: [
        AdminKeyGuard,
        AdminRolesGuard,
        RequestAuthContextService,
        Reflector,
        {
          provide: ExecutionPreviewService,
          useValue: executionPreviewService,
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

  it('requires admin-key auth for query preview', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/query-definitions/${queryDefinitionId}/preview?tenantId=${tenantId}`,
      { method: 'POST' },
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    expect(executionPreviewService.previewQuery).not.toHaveBeenCalled();
  });

  it('allows any valid temporary role for preview reads', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/query-definitions/${queryDefinitionId}/preview?tenantId=${tenantId}`,
      {
        method: 'POST',
        headers: {
          [DELFOS_ADMIN_KEY_HEADER]: adminKey,
          [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Viewer,
        },
      },
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      mode: ExecutionPreviewMode.Demo,
      queryDefinitionId,
      queryKey: 'sales_overview_demo',
    });
    expect(executionPreviewService.previewQuery).toHaveBeenCalledWith(
      tenantId,
      queryDefinitionId,
      {},
      { actorId: undefined },
    );
  });

  it('returns standardized validation error when tenantId is missing', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/query-definitions/${queryDefinitionId}/preview`,
      {
        method: 'POST',
        headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
      },
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });
    expect(JSON.stringify(body)).not.toContain(adminKey);
    expect(executionPreviewService.previewQuery).not.toHaveBeenCalled();
  });

  it('returns standardized not-found errors from query preview service', async () => {
    jest
      .mocked(executionPreviewService.previewQuery)
      .mockRejectedValueOnce(new NotFoundException('Query definition not found.'));

    const response = await fetch(
      `${baseUrl}/api/v1/query-definitions/${queryDefinitionId}/preview?tenantId=${tenantId}`,
      {
        method: 'POST',
        headers: { [DELFOS_ADMIN_KEY_HEADER]: adminKey },
      },
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Query definition not found.',
    });
    expect(body.requestId).toBeDefined();
    expect(body.correlationId).toBeDefined();
  });

  it('routes dashboard preview to the preview service', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/dashboard-definitions/${dashboardDefinitionId}/preview?tenantId=${tenantId}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [DELFOS_ADMIN_KEY_HEADER]: adminKey,
        },
        body: JSON.stringify({ rowLimitPerWidget: 2 }),
      },
    );
    const body = await readJsonRecord(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      mode: ExecutionPreviewMode.Demo,
      dashboardDefinitionId,
      dashboardKey: 'commercial_dashboard_demo',
    });
    expect(executionPreviewService.previewDashboard).toHaveBeenCalledWith(
      tenantId,
      dashboardDefinitionId,
      { rowLimitPerWidget: 2 },
      { actorId: undefined },
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
