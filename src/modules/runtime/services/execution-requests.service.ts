import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { CreateExecutionRequestDto } from '../dto/create-execution-request.dto';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ExecutionRequestDryRunResponseDto } from '../dto/execution-request-dry-run-response.dto';
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
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestDocument,
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestAuditService } from './execution-request-audit.service';
import { ExecutionRequestDryRunService } from './execution-request-dry-run.service';
import { ExecutionRequestEventsService } from './execution-request-events.service';

@Injectable()
export class ExecutionRequestsService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestAuditService: ExecutionRequestAuditService,
    private readonly executionRequestEventsService: ExecutionRequestEventsService,
    private readonly executionRequestDryRunService: ExecutionRequestDryRunService,
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

    const initialEvent = await this.executionRequestEventsService.createInitialAcceptedEvent(
      executionRequest,
      actor,
    );

    await this.executionRequestAuditService.recordExecutionRequest(
      'execution_request.created',
      executionRequest,
      actor,
    );
    await this.executionRequestAuditService.recordEvent(initialEvent, actor);

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

  findEvents(
    executionRequestId: string,
    query: ListExecutionRequestEventsQueryDto,
  ): Promise<ExecutionRequestEventListResponseDto> {
    return this.executionRequestEventsService.findEvents(executionRequestId, query);
  }

  createEvent(
    executionRequestId: string,
    dto: CreateExecutionRequestEventDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestEventResponseDto> {
    return this.executionRequestEventsService.createEvent(executionRequestId, dto, actor);
  }

  dryRun(
    executionRequestId: string,
    query: ExecutionRequestTenantQueryDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestDryRunResponseDto> {
    return this.executionRequestDryRunService.dryRun(executionRequestId, query, actor);
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
}
