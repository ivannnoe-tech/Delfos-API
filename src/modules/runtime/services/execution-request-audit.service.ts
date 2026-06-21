import { Injectable } from '@nestjs/common';

import { AuditService } from '../../audit/services/audit.service';
import { ExecutionRequestEventRecord } from '../repositories/execution-request-events.repository';
import { ExecutionRequestRecord } from '../repositories/execution-requests.repository';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import { ExecutionRequestActorContext } from './execution-request-actor-context';

@Injectable()
export class ExecutionRequestAuditService {
  constructor(private readonly auditService: AuditService) {}

  recordExecutionRequest(
    action: string,
    executionRequest: ExecutionRequestRecord,
    actor: ExecutionRequestActorContext,
    extraMetadata: Record<string, unknown> = {},
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: executionRequest.tenantId,
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action,
        entity: 'execution_request',
        entityId: executionRequest.id,
        metadata: {
          tenantId: executionRequest.tenantId,
          kind: executionRequest.kind,
          status: executionRequest.status,
          queryDefinitionId: executionRequest.queryDefinitionId,
          dashboardDefinitionId: executionRequest.dashboardDefinitionId,
          reportDefinitionId: executionRequest.reportDefinitionId,
          actorId: actor.actorId,
          actorRole: actor.actorRole,
          ...extraMetadata,
        },
      })
      .then(() => undefined);
  }

  recordEvent(
    event: ExecutionRequestEventRecord,
    actor: ExecutionRequestActorContext,
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: event.tenantId,
        actorUserId: this.toAuditActorUserId(actor.actorId),
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
      })
      .then(() => undefined);
  }

  recordDryRun(
    executionRequest: ExecutionRequestRecord,
    actor: ExecutionRequestActorContext,
    metadata: {
      ready: boolean;
      blockersCount: number;
      warningsCount: number;
      nextStatus: ExecutionRequestStatus;
    },
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: executionRequest.tenantId,
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action: 'execution_request.dry_run_checked',
        entity: 'execution_request',
        entityId: executionRequest.id,
        metadata: {
          tenantId: executionRequest.tenantId,
          executionRequestId: executionRequest.id,
          requestKey: executionRequest.requestKey,
          kind: executionRequest.kind,
          ready: metadata.ready,
          blockersCount: metadata.blockersCount,
          warningsCount: metadata.warningsCount,
          nextStatus: metadata.nextStatus,
        },
      })
      .then(() => undefined);
  }

  recordDemoExecute(
    executionRequest: ExecutionRequestRecord,
    actor: ExecutionRequestActorContext,
    metadata: {
      ready: boolean;
      blockersCount: number;
      warningsCount: number;
      status: ExecutionRequestStatus.CompletedDemo | ExecutionRequestStatus.Blocked;
    },
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: executionRequest.tenantId,
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action: 'execution_request.demo_executed',
        entity: 'execution_request',
        entityId: executionRequest.id,
        metadata: {
          tenantId: executionRequest.tenantId,
          executionRequestId: executionRequest.id,
          requestKey: executionRequest.requestKey,
          kind: executionRequest.kind,
          status: metadata.status,
          ready: metadata.ready,
          blockersCount: metadata.blockersCount,
          warningsCount: metadata.warningsCount,
        },
      })
      .then(() => undefined);
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }
}
