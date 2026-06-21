import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ListExecutionRequestEventsQueryDto } from '../dto/execution-request-event-query.dto';
import {
  ExecutionRequestEventListResponseDto,
  ExecutionRequestEventResponseDto,
} from '../dto/execution-request-event-response.dto';
import {
  ExecutionRequestEventRecord,
  ExecutionRequestEventsRepository,
} from '../repositories/execution-request-events.repository';
import {
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from '../repositories/execution-requests.repository';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestAuditService } from './execution-request-audit.service';

@Injectable()
export class ExecutionRequestEventsService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestEventsRepository: ExecutionRequestEventsRepository,
    private readonly executionRequestAuditService: ExecutionRequestAuditService,
  ) {}

  async createInitialAcceptedEvent(
    executionRequest: ExecutionRequestRecord,
    actor: ExecutionRequestActorContext,
  ): Promise<ExecutionRequestEventRecord> {
    return this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: executionRequest.status,
      reason: executionRequest.reason,
      message: executionRequest.message,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      metadata: {},
    });
  }

  async findEvents(
    executionRequestId: string,
    query: ListExecutionRequestEventsQueryDto,
  ): Promise<ExecutionRequestEventListResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(
      query.tenantId,
      executionRequestId,
    );
    const filters = {
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest.id,
      eventType: query.eventType,
    };
    const [items, total] = await Promise.all([
      this.executionRequestEventsRepository.findByFilters(filters, query.page, query.pageSize),
      this.executionRequestEventsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((event) => this.toEventResponse(event)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async createEvent(
    executionRequestId: string,
    dto: CreateExecutionRequestEventDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestEventResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(
      dto.tenantId,
      executionRequestId,
    );
    const nextStatus = this.resolveNextStatus(dto);
    const previousStatus = executionRequest.status;
    let updatedExecutionRequest = executionRequest;

    if (nextStatus && nextStatus !== previousStatus) {
      updatedExecutionRequest =
        (await this.executionRequestsRepository.updateStatusByTenantAndId(
          executionRequest.tenantId,
          executionRequest.id,
          nextStatus,
        )) ?? executionRequest;
    }

    const event = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest.id,
      requestKey: executionRequest.requestKey,
      eventType: dto.eventType,
      previousStatus,
      nextStatus: nextStatus ?? previousStatus,
      message: this.sanitizeOptionalText(dto.message, 'message'),
      reason: this.sanitizeOptionalText(dto.reason, 'reason'),
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      metadata: sanitizeMetadata(dto.metadata),
    });

    await this.executionRequestAuditService.recordEvent(event, actor);

    if (nextStatus && nextStatus !== previousStatus) {
      await this.executionRequestAuditService.recordExecutionRequest(
        'execution_request.status_changed',
        updatedExecutionRequest,
        actor,
        {
          eventType: event.eventType,
          previousStatus,
          nextStatus,
        },
      );
    }

    return this.toEventResponse(event);
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

  private resolveNextStatus(
    dto: CreateExecutionRequestEventDto,
  ): ExecutionRequestStatus | undefined {
    const eventStatus = this.statusFromEventType(dto.eventType);

    if (dto.eventType === ExecutionRequestEventType.StatusChanged && !dto.nextStatus) {
      throw new BadRequestException('nextStatus is required when eventType is status_changed.');
    }

    if (dto.eventType === ExecutionRequestEventType.NoteAdded && dto.nextStatus) {
      throw new BadRequestException('nextStatus is not allowed when eventType is note_added.');
    }

    if (eventStatus && dto.nextStatus && dto.nextStatus !== eventStatus) {
      throw new BadRequestException('nextStatus must match the selected eventType.');
    }

    return eventStatus ?? dto.nextStatus;
  }

  private statusFromEventType(
    eventType: ExecutionRequestEventType,
  ): ExecutionRequestStatus | undefined {
    switch (eventType) {
      case ExecutionRequestEventType.Accepted:
        return ExecutionRequestStatus.Accepted;
      case ExecutionRequestEventType.Blocked:
        return ExecutionRequestStatus.Blocked;
      case ExecutionRequestEventType.Failed:
        return ExecutionRequestStatus.Failed;
      case ExecutionRequestEventType.CompletedDemo:
        return ExecutionRequestStatus.CompletedDemo;
      case ExecutionRequestEventType.NotSupported:
        return ExecutionRequestStatus.NotSupported;
      default:
        return undefined;
    }
  }

  private sanitizeOptionalText(value: string | undefined, key: string): string | undefined {
    const trimmed = value?.trim();

    if (!trimmed) {
      return undefined;
    }

    const sanitized = sanitizeMetadata({ [key]: trimmed })[key];

    return typeof sanitized === 'string' ? sanitized : undefined;
  }

  private toEventResponse(event: ExecutionRequestEventRecord): ExecutionRequestEventResponseDto {
    return {
      id: event.id,
      tenantId: event.tenantId,
      executionRequestId: event.executionRequestId,
      requestKey: event.requestKey,
      eventType: event.eventType,
      previousStatus: event.previousStatus,
      nextStatus: event.nextStatus,
      message: event.message,
      reason: event.reason,
      actorId: event.actorId,
      actorRole: event.actorRole,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
