import { Injectable } from '@nestjs/common';

import { AuditService } from '../../audit/services/audit.service';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import {
  ExecutionRequestDocument,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestEventDocument } from '../schemas/execution-request-event.schema';

@Injectable()
export class ExecutionRequestAuditService {
  constructor(private readonly auditService: AuditService) {}

  recordExecutionRequest(
    action: string,
    executionRequest: ExecutionRequestDocument,
    actor: ExecutionRequestActorContext,
    extraMetadata: Record<string, unknown> = {},
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: executionRequest.tenantId.toString(),
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action,
        entity: 'execution_request',
        entityId: executionRequest._id.toString(),
        metadata: {
          tenantId: executionRequest.tenantId.toString(),
          kind: executionRequest.kind,
          status: executionRequest.status,
          queryDefinitionId: executionRequest.queryDefinitionId?.toString(),
          dashboardDefinitionId: executionRequest.dashboardDefinitionId?.toString(),
          reportDefinitionId: executionRequest.reportDefinitionId?.toString(),
          actorId: actor.actorId,
          actorRole: actor.actorRole,
          ...extraMetadata,
        },
      })
      .then(() => undefined);
  }

  recordEvent(
    event: ExecutionRequestEventDocument,
    actor: ExecutionRequestActorContext,
  ): Promise<void> {
    return this.auditService
      .record({
        tenantId: event.tenantId.toString(),
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action: 'execution_request.event.created',
        entity: 'execution_request_event',
        entityId: event._id.toString(),
        metadata: {
          tenantId: event.tenantId.toString(),
          executionRequestId: event.executionRequestId.toString(),
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
    executionRequest: ExecutionRequestDocument,
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
        tenantId: executionRequest.tenantId.toString(),
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action: 'execution_request.dry_run_checked',
        entity: 'execution_request',
        entityId: executionRequest._id.toString(),
        metadata: {
          tenantId: executionRequest.tenantId.toString(),
          executionRequestId: executionRequest._id.toString(),
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
    executionRequest: ExecutionRequestDocument,
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
        tenantId: executionRequest.tenantId.toString(),
        actorUserId: this.toAuditActorUserId(actor.actorId),
        action: 'execution_request.demo_executed',
        entity: 'execution_request',
        entityId: executionRequest._id.toString(),
        metadata: {
          tenantId: executionRequest.tenantId.toString(),
          executionRequestId: executionRequest._id.toString(),
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
