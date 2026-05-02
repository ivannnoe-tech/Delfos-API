import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { CreateExecutionRequestDto } from '../dto/create-execution-request.dto';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ListExecutionRequestEventsQueryDto } from '../dto/execution-request-event-query.dto';
import {
  ExecutionRequestEventListResponseDto,
  ExecutionRequestEventResponseDto,
} from '../dto/execution-request-event-response.dto';
import {
  ExecutionRequestTenantQueryDto,
  ListExecutionRequestsQueryDto,
} from '../dto/execution-request-query.dto';
import { ExecutionRequestResponseDto } from '../dto/execution-request-response.dto';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestDocument,
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import {
  ExecutionRequestEventDocument,
  ExecutionRequestEventType,
} from '../schemas/execution-request-event.schema';

export interface ExecutionRequestActorContext {
  actorId?: string;
  actorRole?: AdminRole;
}

@Injectable()
export class ExecutionRequestsService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestEventsRepository: ExecutionRequestEventsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateExecutionRequestDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestResponseDto> {
    this.validateRequiredReference(dto);

    const executionRequestId = new Types.ObjectId();
    const executionRequest = await this.executionRequestsRepository.create({
      _id: executionRequestId,
      tenantId: new Types.ObjectId(dto.tenantId),
      requestKey: `exec_req_${executionRequestId.toString()}`,
      kind: dto.kind,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: this.toOptionalObjectId(dto.queryDefinitionId),
      dashboardDefinitionId: this.toOptionalObjectId(dto.dashboardDefinitionId),
      reportDefinitionId: this.toOptionalObjectId(dto.reportDefinitionId),
      connectionId: this.toOptionalObjectId(dto.connectionId),
      datasetId: this.toOptionalObjectId(dto.datasetId),
      requestedByActorId: actor.actorId,
      requestedByRole: actor.actorRole,
      mode: dto.mode ?? ExecutionRequestMode.FutureRuntime,
      reason: 'runtime_foundation_only',
      message: 'Runtime foundation request accepted. No real execution was started.',
      metadata: sanitizeMetadata(dto.metadata),
    });

    const initialEvent = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest._id,
      requestKey: executionRequest.requestKey,
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: executionRequest.status,
      reason: executionRequest.reason,
      message: executionRequest.message,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      metadata: {},
    });

    await this.recordAudit('execution_request.created', executionRequest, actor);
    await this.recordEventAudit(initialEvent, actor);

    return this.toResponse(executionRequest);
  }

  async findByFilters(
    query: ListExecutionRequestsQueryDto,
  ): Promise<ListResponse<ExecutionRequestResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      kind: query.kind,
      status: query.status,
      mode: query.mode,
      queryDefinitionId: this.toOptionalObjectId(query.queryDefinitionId),
      dashboardDefinitionId: this.toOptionalObjectId(query.dashboardDefinitionId),
      reportDefinitionId: this.toOptionalObjectId(query.reportDefinitionId),
      connectionId: this.toOptionalObjectId(query.connectionId),
      datasetId: this.toOptionalObjectId(query.datasetId),
    };
    const [items, total] = await Promise.all([
      this.executionRequestsRepository.findByFilters(filters, query.page, query.pageSize),
      this.executionRequestsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((executionRequest) => this.toResponse(executionRequest)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(
    tenantId: ExecutionRequestTenantQueryDto['tenantId'],
    id: string,
  ): Promise<ExecutionRequestResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(tenantId, id);

    return this.toResponse(executionRequest);
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
      executionRequestId: executionRequest._id,
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
          executionRequest._id.toString(),
          nextStatus,
        )) ?? executionRequest;
    }

    const event = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest._id,
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

    await this.recordEventAudit(event, actor);

    if (nextStatus && nextStatus !== previousStatus) {
      await this.recordAudit('execution_request.status_changed', updatedExecutionRequest, actor, {
        eventType: event.eventType,
        previousStatus,
        nextStatus,
      });
    }

    return this.toEventResponse(event);
  }

  private validateRequiredReference(dto: CreateExecutionRequestDto): void {
    if (dto.kind === ExecutionRequestKind.Query && !dto.queryDefinitionId) {
      throw new BadRequestException('queryDefinitionId is required when kind is query.');
    }

    if (dto.kind === ExecutionRequestKind.Dashboard && !dto.dashboardDefinitionId) {
      throw new BadRequestException('dashboardDefinitionId is required when kind is dashboard.');
    }

    if (dto.kind === ExecutionRequestKind.Report && !dto.reportDefinitionId) {
      throw new BadRequestException('reportDefinitionId is required when kind is report.');
    }
  }

  private async recordAudit(
    action: string,
    executionRequest: ExecutionRequestDocument,
    actor: ExecutionRequestActorContext,
    extraMetadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.auditService.record({
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
    });
  }

  private async recordEventAudit(
    event: ExecutionRequestEventDocument,
    actor: ExecutionRequestActorContext,
  ): Promise<void> {
    await this.auditService.record({
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
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toOptionalObjectId(value?: string): Types.ObjectId | undefined {
    return value ? new Types.ObjectId(value) : undefined;
  }

  private async getExecutionRequestOrThrow(
    tenantId: string,
    executionRequestId: string,
  ): Promise<ExecutionRequestDocument> {
    const executionRequest = await this.executionRequestsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
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

  private toResponse(executionRequest: ExecutionRequestDocument): ExecutionRequestResponseDto {
    return {
      id: executionRequest._id.toString(),
      tenantId: executionRequest.tenantId.toString(),
      requestKey: executionRequest.requestKey,
      kind: executionRequest.kind,
      status: executionRequest.status,
      queryDefinitionId: executionRequest.queryDefinitionId?.toString(),
      dashboardDefinitionId: executionRequest.dashboardDefinitionId?.toString(),
      reportDefinitionId: executionRequest.reportDefinitionId?.toString(),
      connectionId: executionRequest.connectionId?.toString(),
      datasetId: executionRequest.datasetId?.toString(),
      requestedByActorId: executionRequest.requestedByActorId,
      requestedByRole: executionRequest.requestedByRole,
      mode: executionRequest.mode,
      reason: executionRequest.reason,
      message: executionRequest.message,
      metadata: executionRequest.metadata,
      createdAt: executionRequest.createdAt.toISOString(),
      updatedAt: executionRequest.updatedAt.toISOString(),
    };
  }

  private toEventResponse(event: ExecutionRequestEventDocument): ExecutionRequestEventResponseDto {
    return {
      id: event._id.toString(),
      tenantId: event.tenantId.toString(),
      executionRequestId: event.executionRequestId.toString(),
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
