import { Injectable, NotFoundException } from '@nestjs/common';

import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { ExecutionRequestDryRunResponseDto } from '../dto/execution-request-dry-run-response.dto';
import { ExecutionRequestTenantQueryDto } from '../dto/execution-request-query.dto';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import {
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from '../repositories/execution-requests.repository';
import { ExecutionRequestMode, ExecutionRequestStatus } from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestAuditService } from './execution-request-audit.service';
import { ExecutionRequestReadinessService } from './execution-request-readiness.service';

@Injectable()
export class ExecutionRequestDryRunService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestEventsRepository: ExecutionRequestEventsRepository,
    private readonly executionRequestAuditService: ExecutionRequestAuditService,
    private readonly executionRequestReadinessService: ExecutionRequestReadinessService,
  ) {}

  async dryRun(
    executionRequestId: string,
    query: ExecutionRequestTenantQueryDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestDryRunResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(
      query.tenantId,
      executionRequestId,
    );
    const readiness = await this.executionRequestReadinessService.evaluate(executionRequest);
    const ready = readiness.blockers.length === 0;
    const recommendedStatus = ready
      ? ExecutionRequestStatus.Accepted
      : ExecutionRequestStatus.Blocked;
    const previousStatus = executionRequest.status;
    let updatedExecutionRequest = executionRequest;

    if (recommendedStatus !== previousStatus) {
      updatedExecutionRequest =
        (await this.executionRequestsRepository.updateStatusByTenantAndId(
          executionRequest.tenantId,
          executionRequest.id,
          recommendedStatus,
        )) ?? executionRequest;
    }

    const event = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      eventType: ready ? ExecutionRequestEventType.Accepted : ExecutionRequestEventType.Blocked,
      previousStatus,
      nextStatus: recommendedStatus,
      message: this.toDryRunEventMessage(ready),
      reason: 'dry_run_readiness_checked',
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      metadata: sanitizeMetadata({
        mode: ExecutionRequestMode.DryRun,
        kind: executionRequest.kind,
        ready,
        checksCount: readiness.checks.length,
        warningsCount: readiness.warnings.length,
        blockersCount: readiness.blockers.length,
        nextStatus: recommendedStatus,
      }),
    });

    await this.executionRequestAuditService.recordEvent(event, actor);
    await this.executionRequestAuditService.recordDryRun(updatedExecutionRequest, actor, {
      ready,
      blockersCount: readiness.blockers.length,
      warningsCount: readiness.warnings.length,
      nextStatus: recommendedStatus,
    });

    if (recommendedStatus !== previousStatus) {
      await this.executionRequestAuditService.recordExecutionRequest(
        'execution_request.status_changed',
        updatedExecutionRequest,
        actor,
        {
          eventType: event.eventType,
          previousStatus,
          nextStatus: recommendedStatus,
        },
      );
    }

    return {
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      kind: executionRequest.kind,
      recommendedStatus,
      ready,
      checks: readiness.checks,
      warnings: readiness.warnings,
      blockers: readiness.blockers,
      mode: ExecutionRequestMode.DryRun,
      message:
        'Dry-run readiness checked declarative contracts only. No real runtime execution was started.',
      reason: 'dry_run_readiness_checked',
    };
  }

  private async getExecutionRequestOrThrow(
    tenantId: string,
    executionRequestId: string,
  ): Promise<ExecutionRequestRecord> {
    const executionRequest = await this.executionRequestsRepository.findByTenantAndId(
      tenantId,
      executionRequestId,
    );

    if (!executionRequest) {
      throw new NotFoundException('Execution request not found.');
    }

    return executionRequest;
  }

  private toDryRunEventMessage(ready: boolean): string {
    return ready
      ? 'Dry-run readiness passed declarative checks. No real runtime execution was started.'
      : 'Dry-run readiness found declarative blockers. No real runtime execution was started.';
  }
}
