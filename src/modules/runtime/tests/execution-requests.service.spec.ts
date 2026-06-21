import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import { ExecutionRequestDemoExecuteResponseDto } from '../dto/execution-request-demo-execute-response.dto';
import { ExecutionRequestDryRunResponseDto } from '../dto/execution-request-dry-run-response.dto';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';
import { ExecutionRequestAuditService } from '../services/execution-request-audit.service';
import { ExecutionRequestDemoExecutorService } from '../services/execution-request-demo-executor.service';
import { ExecutionRequestDryRunService } from '../services/execution-request-dry-run.service';
import { ExecutionRequestEventsService } from '../services/execution-request-events.service';
import { ExecutionRequestsService } from '../services/execution-requests.service';
import {
  createActorFixture,
  createRuntimeEventFixture,
  createRuntimeRequestFixture,
  newId,
} from './execution-request-test-fixtures';

describe('ExecutionRequestsService', () => {
  it.each([
    {
      kind: ExecutionRequestKind.Query,
      referenceField: 'queryDefinitionId',
      referenceId: newId(),
    },
    {
      kind: ExecutionRequestKind.Dashboard,
      referenceField: 'dashboardDefinitionId',
      referenceId: newId(),
    },
    {
      kind: ExecutionRequestKind.Report,
      referenceField: 'reportDefinitionId',
      referenceId: newId(),
    },
  ] as const)('creates a $kind request and initial accepted event', async (caseData) => {
    const tenantId = newId();
    const datasetId = newId();
    const connectionId = newId();
    const repository: Pick<ExecutionRequestsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createRuntimeRequestFixture({
          tenantId: record.tenantId,
          requestKey: record.requestKey,
          kind: record.kind,
          status: record.status,
          queryDefinitionId: record.queryDefinitionId,
          dashboardDefinitionId: record.dashboardDefinitionId,
          reportDefinitionId: record.reportDefinitionId,
          connectionId: record.connectionId,
          datasetId: record.datasetId,
          requestedByActorId: record.requestedByActorId,
          requestedByRole: record.requestedByRole,
          mode: record.mode,
          reason: record.reason,
          message: record.message,
          metadata: record.metadata,
        }),
      ),
    };
    const auditService = createAuditServiceMock();
    const eventsService = createEventsServiceMock();
    const service = createService(repository, auditService, eventsService);

    const result = await service.create(
      {
        tenantId,
        kind: caseData.kind,
        [caseData.referenceField]: caseData.referenceId,
        connectionId,
        datasetId,
        mode: ExecutionRequestMode.FutureRuntime,
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
          authorization: 'Bearer must-not-leak-token',
        },
      },
      createActorFixture(),
    );

    const createRecord = jest.mocked(repository.create).mock.calls[0]?.[0];

    expect(createRecord).toBeDefined();
    expect(createRecord?.tenantId).toBe(tenantId);
    expect(createRecord?.requestKey).toMatch(/^exec_req_[0-9a-f]{24}$/);
    expect(createRecord?.kind).toBe(caseData.kind);
    expect(createRecord?.status).toBe(ExecutionRequestStatus.Accepted);
    expect(createRecord?.[caseData.referenceField]).toBe(caseData.referenceId);
    expect(createRecord?.metadata).toEqual({ domain: 'sales' });
    expect(auditService.recordExecutionRequest).toHaveBeenCalledWith(
      'execution_request.created',
      expect.objectContaining({ kind: caseData.kind }),
      createActorFixture(),
    );
    expect(auditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: ExecutionRequestEventType.Accepted }),
      createActorFixture(),
    );
    expect(eventsService.createInitialAcceptedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        requestKey: result.requestKey,
        status: ExecutionRequestStatus.Accepted,
      }),
      createActorFixture(),
    );
    expect(result).toMatchObject({
      tenantId,
      kind: caseData.kind,
      status: ExecutionRequestStatus.Accepted,
      connectionId,
      datasetId,
      requestedByRole: AdminRole.Operator,
      mode: ExecutionRequestMode.FutureRuntime,
      reason: 'runtime_foundation_only',
      message: 'Runtime foundation request accepted. No real execution was started.',
      metadata: { domain: 'sales' },
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });

  it('returns validation errors when kind does not have its required reference', async () => {
    const service = createService({ create: jest.fn() });

    await expect(
      service.create({
        tenantId: newId(),
        kind: ExecutionRequestKind.Query,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists execution requests by tenant scoped filters', async () => {
    const tenantId = newId();
    const queryDefinitionId = newId();
    const repository: Pick<ExecutionRequestsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createRuntimeRequestFixture({
          tenantId,
          queryDefinitionId,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository);

    const result = await service.findByFilters({
      tenantId,
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        kind: ExecutionRequestKind.Query,
        status: ExecutionRequestStatus.Accepted,
        mode: undefined,
        queryDefinitionId,
        dashboardDefinitionId: undefined,
        reportDefinitionId: undefined,
        connectionId: undefined,
        datasetId: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('reads one execution request using tenant scoped lookup', async () => {
    const tenantId = newId();
    const executionRequestId = newId();
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(service.findOne(tenantId, executionRequestId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(tenantId, executionRequestId);
  });

  it('delegates events, dry-run, and demo execution to focused services', async () => {
    const eventsService = createEventsServiceMock();
    const dryRunService = createDryRunServiceMock();
    const demoExecutorService = createDemoExecutorServiceMock();
    const service = createService(
      {},
      createAuditServiceMock(),
      eventsService,
      dryRunService,
      demoExecutorService,
    );
    const executionRequestId = newId();
    const tenantId = newId();

    await service.findEvents(executionRequestId, { tenantId, page: 1, pageSize: 25 });
    await service.createEvent(
      executionRequestId,
      { tenantId, eventType: ExecutionRequestEventType.NoteAdded, message: 'safe note' },
      createActorFixture(),
    );
    await service.dryRun(executionRequestId, { tenantId }, createActorFixture());
    await service.demoExecute(executionRequestId, { tenantId }, createActorFixture());

    expect(eventsService.findEvents).toHaveBeenCalledWith(executionRequestId, {
      tenantId,
      page: 1,
      pageSize: 25,
    });
    expect(eventsService.createEvent).toHaveBeenCalledWith(
      executionRequestId,
      { tenantId, eventType: ExecutionRequestEventType.NoteAdded, message: 'safe note' },
      createActorFixture(),
    );
    expect(dryRunService.dryRun).toHaveBeenCalledWith(
      executionRequestId,
      { tenantId },
      createActorFixture(),
    );
    expect(demoExecutorService.demoExecute).toHaveBeenCalledWith(
      executionRequestId,
      { tenantId },
      createActorFixture(),
    );
  });
});

function createService(
  repository: Partial<ExecutionRequestsRepository>,
  auditService: Partial<ExecutionRequestAuditService> = createAuditServiceMock(),
  eventsService: Partial<ExecutionRequestEventsService> = createEventsServiceMock(),
  dryRunService: Partial<ExecutionRequestDryRunService> = createDryRunServiceMock(),
  demoExecutorService: Partial<ExecutionRequestDemoExecutorService> = createDemoExecutorServiceMock(),
): ExecutionRequestsService {
  return new ExecutionRequestsService(
    repository as ExecutionRequestsRepository,
    auditService as ExecutionRequestAuditService,
    eventsService as ExecutionRequestEventsService,
    dryRunService as ExecutionRequestDryRunService,
    demoExecutorService as ExecutionRequestDemoExecutorService,
  );
}

function createAuditServiceMock(): Pick<
  ExecutionRequestAuditService,
  'recordExecutionRequest' | 'recordEvent'
> {
  return {
    recordExecutionRequest: jest.fn(async () => undefined),
    recordEvent: jest.fn(async () => undefined),
  };
}

function createEventsServiceMock(): Partial<ExecutionRequestEventsService> {
  return {
    createInitialAcceptedEvent: jest.fn(async () =>
      createRuntimeEventFixture({
        eventType: ExecutionRequestEventType.Accepted,
        nextStatus: ExecutionRequestStatus.Accepted,
      }),
    ),
    findEvents: jest.fn(async () => ({
      items: [],
      meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    })),
    createEvent: jest.fn(async () => ({
      id: newId(),
      tenantId: newId(),
      executionRequestId: newId(),
      requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
      eventType: ExecutionRequestEventType.NoteAdded,
      metadata: {},
      createdAt: '2026-05-02T12:00:00.000Z',
    })),
  };
}

function createDryRunServiceMock(): Pick<ExecutionRequestDryRunService, 'dryRun'> {
  const response: ExecutionRequestDryRunResponseDto = {
    executionRequestId: newId(),
    requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
    kind: ExecutionRequestKind.Query,
    recommendedStatus: ExecutionRequestStatus.Accepted,
    ready: true,
    checks: [],
    warnings: [],
    blockers: [],
    mode: ExecutionRequestMode.DryRun,
    message:
      'Dry-run readiness checked declarative contracts only. No real runtime execution was started.',
    reason: 'dry_run_readiness_checked',
  };

  return {
    dryRun: jest.fn(async () => response),
  };
}

function createDemoExecutorServiceMock(): Pick<ExecutionRequestDemoExecutorService, 'demoExecute'> {
  const response: ExecutionRequestDemoExecuteResponseDto = {
    executionRequestId: newId(),
    requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
    kind: ExecutionRequestKind.Query,
    status: ExecutionRequestStatus.CompletedDemo,
    mode: ExecutionRequestMode.Demo,
    generatedAt: '2026-05-02T12:00:00.000Z',
    ready: true,
    summary:
      'Demo execution completed with fictitious data only. No connector, query, export, worker, queue, cache or scheduler was used.',
    checksCount: 1,
    warningsCount: 0,
    blockersCount: 0,
    demoResult: { query: { sampleRows: [], sampleMetrics: [] } },
    message:
      'Demo runtime executor foundation generated a safe demo result. No real runtime execution was started.',
    reason: 'demo_runtime_executor_foundation',
  };

  return {
    demoExecute: jest.fn(async () => response),
  };
}
