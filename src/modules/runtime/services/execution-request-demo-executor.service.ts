import { Injectable, NotFoundException } from '@nestjs/common';

import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import {
  ExecutionRequestDemoExecuteResponseDto,
  ExecutionRequestDemoResultDto,
} from '../dto/execution-request-demo-execute-response.dto';
import { ExecutionRequestTenantQueryDto } from '../dto/execution-request-query.dto';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import {
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestAuditService } from './execution-request-audit.service';
import { ExecutionRequestReadinessService } from './execution-request-readiness.service';

const demoExecutorReason = 'demo_runtime_executor_foundation';

@Injectable()
export class ExecutionRequestDemoExecutorService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestEventsRepository: ExecutionRequestEventsRepository,
    private readonly executionRequestAuditService: ExecutionRequestAuditService,
    private readonly executionRequestReadinessService: ExecutionRequestReadinessService,
  ) {}

  async demoExecute(
    executionRequestId: string,
    query: ExecutionRequestTenantQueryDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestDemoExecuteResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(
      query.tenantId,
      executionRequestId,
    );
    const readiness = await this.executionRequestReadinessService.evaluate(executionRequest);
    const ready = readiness.blockers.length === 0;
    const status = ready ? ExecutionRequestStatus.CompletedDemo : ExecutionRequestStatus.Blocked;
    const previousStatus = executionRequest.status;
    const generatedAt = new Date().toISOString();
    let updatedExecutionRequest = executionRequest;

    if (status !== previousStatus) {
      updatedExecutionRequest =
        (await this.executionRequestsRepository.updateStatusByTenantAndId(
          executionRequest.tenantId,
          executionRequest.id,
          status,
        )) ?? executionRequest;
    }

    const event = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      eventType: ready
        ? ExecutionRequestEventType.CompletedDemo
        : ExecutionRequestEventType.Blocked,
      previousStatus,
      nextStatus: status,
      message: this.toEventMessage(ready),
      reason: demoExecutorReason,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      metadata: sanitizeMetadata({
        mode: ExecutionRequestMode.Demo,
        kind: executionRequest.kind,
        status,
        ready,
        checksCount: readiness.checks.length,
        warningsCount: readiness.warnings.length,
        blockersCount: readiness.blockers.length,
        demoResultIncluded: ready,
      }),
    });

    await this.executionRequestAuditService.recordEvent(event, actor);
    await this.executionRequestAuditService.recordDemoExecute(updatedExecutionRequest, actor, {
      ready,
      blockersCount: readiness.blockers.length,
      warningsCount: readiness.warnings.length,
      status,
    });

    if (status !== previousStatus) {
      await this.executionRequestAuditService.recordExecutionRequest(
        'execution_request.status_changed',
        updatedExecutionRequest,
        actor,
        {
          eventType: event.eventType,
          previousStatus,
          nextStatus: status,
        },
      );
    }

    return {
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      kind: executionRequest.kind,
      status,
      mode: ExecutionRequestMode.Demo,
      generatedAt,
      ready,
      summary: this.toSummary(ready),
      checksCount: readiness.checks.length,
      warningsCount: readiness.warnings.length,
      blockersCount: readiness.blockers.length,
      demoResult: ready ? this.buildDemoResult(executionRequest.kind) : undefined,
      message: this.toResponseMessage(ready),
      reason: demoExecutorReason,
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

  private buildDemoResult(kind: ExecutionRequestKind): ExecutionRequestDemoResultDto {
    switch (kind) {
      case ExecutionRequestKind.Query:
        return {
          query: {
            sampleRows: [
              { period: 'Jan demo', total_demo_value: 125000, records_demo_count: 42 },
              { period: 'Feb demo', total_demo_value: 132500, records_demo_count: 47 },
            ],
            sampleMetrics: [
              {
                key: 'demo_total_value',
                label: 'Demo total value',
                value: 257500,
                unit: 'demo_currency',
              },
              {
                key: 'demo_records_count',
                label: 'Demo records count',
                value: 89,
              },
            ],
          },
        };
      case ExecutionRequestKind.Dashboard:
        return {
          dashboard: {
            sampleWidgets: [
              {
                widgetKey: 'demo_total_value',
                title: 'Demo total value',
                type: 'metric_card',
                status: 'ready',
                sampleMetrics: [
                  {
                    key: 'demo_total_value',
                    label: 'Demo total value',
                    value: 257500,
                    unit: 'demo_currency',
                  },
                ],
              },
              {
                widgetKey: 'demo_trend',
                title: 'Demo trend',
                type: 'line_chart',
                status: 'ready',
                sampleMetrics: [
                  {
                    key: 'demo_growth_rate',
                    label: 'Demo growth rate',
                    value: 0.14,
                    unit: 'ratio',
                  },
                ],
              },
            ],
          },
        };
      case ExecutionRequestKind.Report:
        return {
          report: {
            sampleReportBlocks: [
              {
                blockKey: 'demo_summary',
                title: 'Demo summary',
                type: 'summary',
                status: 'ready',
              },
              {
                blockKey: 'demo_table',
                title: 'Demo table',
                type: 'table',
                status: 'ready',
              },
            ],
            exportPreview: 'Export preview only. No PDF, Excel or CSV file was generated.',
          },
        };
    }
  }

  private toSummary(ready: boolean): string {
    return ready
      ? 'Demo execution completed with fictitious data only. No connector, query, export, worker, queue, cache or scheduler was used.'
      : 'Demo execution blocked by declarative readiness. No runtime execution, connector, query or export was started.';
  }

  private toResponseMessage(ready: boolean): string {
    return ready
      ? 'Demo runtime executor foundation generated a safe demo result. No real runtime execution was started.'
      : 'Demo runtime executor foundation found readiness blockers. No real runtime execution was started.';
  }

  private toEventMessage(ready: boolean): string {
    return ready
      ? 'Demo runtime executor foundation completed with safe fictitious data only.'
      : 'Demo runtime executor foundation blocked by declarative readiness.';
  }
}
