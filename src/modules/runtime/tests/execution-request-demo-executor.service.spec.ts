import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';
import { ExecutionRequestAuditService } from '../services/execution-request-audit.service';
import { ExecutionRequestDemoExecutorService } from '../services/execution-request-demo-executor.service';
import {
  ExecutionRequestReadinessService,
  ReadinessAccumulator,
} from '../services/execution-request-readiness.service';
import {
  createActorFixture,
  createRuntimeEventFixture,
  createRuntimeRequestFixture,
  newId,
} from './execution-request-test-fixtures';

describe('ExecutionRequestDemoExecutorService', () => {
  it.each([
    [ExecutionRequestKind.Query, 'query'],
    [ExecutionRequestKind.Dashboard, 'dashboard'],
    [ExecutionRequestKind.Report, 'report'],
  ] as const)('runs demo-execute for %s with readiness ok', async (kind, resultKey) => {
    const harness = createDemoExecutorHarness({
      kind,
      readiness: createReadyReadiness(),
    });

    const result = await harness.service.demoExecute(
      harness.executionRequestId,
      { tenantId: harness.tenantId },
      createActorFixture(),
    );

    expect(result).toMatchObject({
      executionRequestId: harness.executionRequestId,
      requestKey: `exec_req_${harness.executionRequestId}`,
      kind,
      status: ExecutionRequestStatus.CompletedDemo,
      mode: ExecutionRequestMode.Demo,
      ready: true,
      checksCount: 2,
      warningsCount: 1,
      blockersCount: 0,
      reason: 'demo_runtime_executor_foundation',
    });
    expect(result.summary).toContain('fictitious data only');
    expect(result.message).toContain('No real runtime execution was started.');
    expect(result.demoResult).toHaveProperty(resultKey);
    expect(harness.executionRequestsRepository.findByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
    );
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
      ExecutionRequestStatus.CompletedDemo,
    );
    expect(harness.readinessService.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ kind }),
    );
    expect(harness.eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.CompletedDemo,
        previousStatus: ExecutionRequestStatus.Accepted,
        nextStatus: ExecutionRequestStatus.CompletedDemo,
        reason: 'demo_runtime_executor_foundation',
        metadata: {
          mode: ExecutionRequestMode.Demo,
          kind,
          status: ExecutionRequestStatus.CompletedDemo,
          ready: true,
          checksCount: 2,
          warningsCount: 1,
          blockersCount: 0,
          demoResultIncluded: true,
        },
      }),
    );
    expect(harness.auditService.recordDemoExecute).toHaveBeenCalledWith(
      expect.objectContaining({ requestKey: `exec_req_${harness.executionRequestId}` }),
      createActorFixture(),
      {
        ready: true,
        blockersCount: 0,
        warningsCount: 1,
        status: ExecutionRequestStatus.CompletedDemo,
      },
    );
    expect(JSON.stringify(result)).not.toMatch(/secret|token|password|apiKey|clientSecret/i);
  });

  it('blocks demo-execute when readiness has blockers and does not include a demo result', async () => {
    const harness = createDemoExecutorHarness({
      kind: ExecutionRequestKind.Query,
      readiness: createBlockedReadiness(),
    });

    const result = await harness.service.demoExecute(harness.executionRequestId, {
      tenantId: harness.tenantId,
    });

    expect(result.ready).toBe(false);
    expect(result.status).toBe(ExecutionRequestStatus.Blocked);
    expect(result.demoResult).toBeUndefined();
    expect(result.summary).toContain('blocked by declarative readiness');
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
      ExecutionRequestStatus.Blocked,
    );
    expect(harness.eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.Blocked,
        nextStatus: ExecutionRequestStatus.Blocked,
        reason: 'demo_runtime_executor_foundation',
        metadata: {
          mode: ExecutionRequestMode.Demo,
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Blocked,
          ready: false,
          checksCount: 0,
          warningsCount: 0,
          blockersCount: 1,
          demoResultIncluded: false,
        },
      }),
    );
  });

  it('keeps audit metadata safe and does not audit the demo result payload', async () => {
    const harness = createDemoExecutorHarness({
      kind: ExecutionRequestKind.Report,
      readiness: createReadyReadiness(),
    });

    await harness.service.demoExecute(
      harness.executionRequestId,
      { tenantId: harness.tenantId },
      createActorFixture(),
    );

    const auditCall = jest.mocked(harness.auditService.recordDemoExecute).mock.calls[0];
    const eventCall = jest.mocked(harness.eventRepository.create).mock.calls[0];

    expect(auditCall?.[2]).toEqual({
      ready: true,
      blockersCount: 0,
      warningsCount: 1,
      status: ExecutionRequestStatus.CompletedDemo,
    });
    expect(JSON.stringify(auditCall)).not.toMatch(/sampleRows|sampleWidgets|sampleReportBlocks/);
    expect(JSON.stringify(eventCall)).not.toMatch(/sampleRows|sampleWidgets|sampleReportBlocks/);
  });

  it('does not call connection, credential, or connector executors', async () => {
    const externalExecutors = {
      findConnection: jest.fn(),
      findCredential: jest.fn(),
      executeConnector: jest.fn(),
    };
    const harness = createDemoExecutorHarness({
      kind: ExecutionRequestKind.Query,
      readiness: createReadyReadiness(),
    });

    await harness.service.demoExecute(harness.executionRequestId, {
      tenantId: harness.tenantId,
    });

    expect(externalExecutors.findConnection).not.toHaveBeenCalled();
    expect(externalExecutors.findCredential).not.toHaveBeenCalled();
    expect(externalExecutors.executeConnector).not.toHaveBeenCalled();
    expect(harness.readinessService.evaluate).toHaveBeenCalledTimes(1);
  });
});

interface DemoExecutorHarnessOptions {
  kind: ExecutionRequestKind;
  readiness: ReadinessAccumulator;
}

function createDemoExecutorHarness(options: DemoExecutorHarnessOptions) {
  const tenantId = newId();
  const executionRequestId = newId();
  const executionRequest = createRuntimeRequestFixture({
    id: executionRequestId,
    tenantId,
    kind: options.kind,
    status: ExecutionRequestStatus.Accepted,
  });
  const executionRequestsRepository: Pick<
    ExecutionRequestsRepository,
    'findByTenantAndId' | 'updateStatusByTenantAndId'
  > = {
    findByTenantAndId: jest.fn(async () => executionRequest),
    updateStatusByTenantAndId: jest.fn(async (_tenantId, _id, status) =>
      createRuntimeRequestFixture({ ...executionRequest, status }),
    ),
  };
  const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
    create: jest.fn(async (record) => createRuntimeEventFixture(record)),
  };
  const auditService = createAuditServiceMock();
  const readinessService: Pick<ExecutionRequestReadinessService, 'evaluate'> = {
    evaluate: jest.fn(async () => options.readiness),
  };
  const service = new ExecutionRequestDemoExecutorService(
    executionRequestsRepository as ExecutionRequestsRepository,
    eventRepository as ExecutionRequestEventsRepository,
    auditService as ExecutionRequestAuditService,
    readinessService as ExecutionRequestReadinessService,
  );

  return {
    service,
    tenantId,
    executionRequestId,
    executionRequestsRepository,
    eventRepository,
    auditService,
    readinessService,
  };
}

function createReadyReadiness(): ReadinessAccumulator {
  return {
    checks: [
      {
        code: 'query_definition_found',
        message: 'Query definition exists for this tenant.',
        target: 'executionRequest.queryDefinitionId',
      },
      {
        code: 'field_mappings_found',
        message: 'Field mappings exist for this dataset key.',
        target: 'executionRequest.queryDefinitionId.datasetId.fieldMappings',
      },
    ],
    warnings: [
      {
        code: 'demo_warning',
        message: 'Demo warning.',
        target: 'executionRequest',
      },
    ],
    blockers: [],
  };
}

function createBlockedReadiness(): ReadinessAccumulator {
  return {
    checks: [],
    warnings: [],
    blockers: [
      {
        code: 'query_definition_not_found',
        message: 'Query definition was not found for this tenant.',
        target: 'executionRequest.queryDefinitionId',
      },
    ],
  };
}

function createAuditServiceMock(): Pick<
  ExecutionRequestAuditService,
  'recordEvent' | 'recordDemoExecute' | 'recordExecutionRequest'
> {
  return {
    recordEvent: jest.fn(async () => undefined),
    recordDemoExecute: jest.fn(async () => undefined),
    recordExecutionRequest: jest.fn(async () => undefined),
  };
}
