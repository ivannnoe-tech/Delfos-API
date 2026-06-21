import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestAuditService } from '../services/execution-request-audit.service';
import {
  ExecutionRequestKind,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import {
  AuditServiceMock,
  createActorFixture,
  createAuditService,
  createRuntimeEventFixture,
  createRuntimeRequestFixture,
} from './execution-request-test-fixtures';

describe('ExecutionRequestAuditService', () => {
  let auditService: AuditServiceMock;
  let service: ExecutionRequestAuditService;

  beforeEach(() => {
    auditService = createAuditService();
    service = new ExecutionRequestAuditService(auditService as unknown as AuditService);
  });

  it('records an execution request with tenant-scoped metadata and merges extra metadata', async () => {
    const executionRequest = createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query });
    const actor = createActorFixture();

    await service.recordExecutionRequest('execution_request.created', executionRequest, actor, {
      reason: 'foundation_only',
    });

    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: executionRequest.tenantId,
      actorUserId: actor.actorId,
      action: 'execution_request.created',
      entity: 'execution_request',
      entityId: executionRequest.id,
      metadata: {
        tenantId: executionRequest.tenantId,
        kind: ExecutionRequestKind.Query,
        status: executionRequest.status,
        queryDefinitionId: executionRequest.queryDefinitionId,
        dashboardDefinitionId: executionRequest.dashboardDefinitionId,
        reportDefinitionId: executionRequest.reportDefinitionId,
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        reason: 'foundation_only',
      },
    });
  });

  it('omits actorUserId when the actor id is not a valid ObjectId', async () => {
    const executionRequest = createRuntimeRequestFixture();

    await service.recordExecutionRequest('execution_request.created', executionRequest, {
      actorId: 'dev-actor-001',
      actorRole: AdminRole.Operator,
    });

    const payload = lastRecordPayload(auditService);
    expect(payload.actorUserId).toBeUndefined();
    expect(payload.metadata).toMatchObject({ actorId: 'dev-actor-001' });
  });

  it('keeps actorUserId when the actor id is a valid ObjectId', async () => {
    const executionRequest = createRuntimeRequestFixture();
    const actor = createActorFixture();

    await service.recordExecutionRequest('execution_request.created', executionRequest, actor);

    expect(lastRecordPayload(auditService).actorUserId).toBe(actor.actorId);
  });

  it('records an execution request event under the event entity', async () => {
    const event = createRuntimeEventFixture();
    const actor = createActorFixture();

    await service.recordEvent(event, actor);

    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: event.tenantId,
      actorUserId: actor.actorId,
      action: 'execution_request.event.created',
      entity: 'execution_request_event',
      entityId: event.id,
      metadata: {
        tenantId: event.tenantId,
        executionRequestId: event.executionRequestId,
        requestKey: event.requestKey,
        eventType: event.eventType,
        previousStatus: event.previousStatus,
        nextStatus: event.nextStatus,
        actorId: actor.actorId,
        actorRole: actor.actorRole,
      },
    });
  });

  it('records a dry-run check with readiness counters', async () => {
    const executionRequest = createRuntimeRequestFixture();
    const actor = createActorFixture();

    await service.recordDryRun(executionRequest, actor, {
      ready: false,
      blockersCount: 2,
      warningsCount: 1,
      nextStatus: ExecutionRequestStatus.Blocked,
    });

    const payload = lastRecordPayload(auditService);
    expect(payload.action).toBe('execution_request.dry_run_checked');
    expect(payload.entity).toBe('execution_request');
    expect(payload.metadata).toMatchObject({
      ready: false,
      blockersCount: 2,
      warningsCount: 1,
      nextStatus: ExecutionRequestStatus.Blocked,
    });
  });

  it('records a demo execution with its resulting status', async () => {
    const executionRequest = createRuntimeRequestFixture();
    const actor = createActorFixture();

    await service.recordDemoExecute(executionRequest, actor, {
      ready: true,
      blockersCount: 0,
      warningsCount: 0,
      status: ExecutionRequestStatus.CompletedDemo,
    });

    const payload = lastRecordPayload(auditService);
    expect(payload.action).toBe('execution_request.demo_executed');
    expect(payload.entity).toBe('execution_request');
    expect(payload.metadata).toMatchObject({
      status: ExecutionRequestStatus.CompletedDemo,
      ready: true,
    });
  });
});

function lastRecordPayload(auditService: AuditServiceMock): Parameters<AuditService['record']>[0] {
  const calls = auditService.record.mock.calls;
  const lastCall = calls[calls.length - 1];

  if (!lastCall) {
    throw new Error('Expected AuditService.record to have been called.');
  }

  return lastCall[0];
}
