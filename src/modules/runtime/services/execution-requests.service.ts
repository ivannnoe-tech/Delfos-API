import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { CreateExecutionRequestDto } from '../dto/create-execution-request.dto';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ExecutionRequestDemoExecuteResponseDto } from '../dto/execution-request-demo-execute-response.dto';
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
import {
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestAuditService } from './execution-request-audit.service';
import { ExecutionRequestDemoExecutorService } from './execution-request-demo-executor.service';
import { ExecutionRequestDryRunService } from './execution-request-dry-run.service';
import { ExecutionRequestEventsService } from './execution-request-events.service';

@Injectable()
export class ExecutionRequestsService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestAuditService: ExecutionRequestAuditService,
    private readonly executionRequestEventsService: ExecutionRequestEventsService,
    private readonly executionRequestDryRunService: ExecutionRequestDryRunService,
    private readonly executionRequestDemoExecutorService: ExecutionRequestDemoExecutorService,
  ) {}

  async create(
    dto: CreateExecutionRequestDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestResponseDto> {
    this.validateRequiredReference(dto);

    const requestKey = `exec_req_${new Types.ObjectId().toString()}`;
    const executionRequest = await this.executionRequestsRepository.create({
      tenantId: dto.tenantId,
      requestKey,
      kind: dto.kind,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: dto.queryDefinitionId,
      dashboardDefinitionId: dto.dashboardDefinitionId,
      reportDefinitionId: dto.reportDefinitionId,
      connectionId: dto.connectionId,
      datasetId: dto.datasetId,
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
      tenantId: query.tenantId,
      kind: query.kind,
      status: query.status,
      mode: query.mode,
      queryDefinitionId: query.queryDefinitionId,
      dashboardDefinitionId: query.dashboardDefinitionId,
      reportDefinitionId: query.reportDefinitionId,
      connectionId: query.connectionId,
      datasetId: query.datasetId,
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

  demoExecute(
    executionRequestId: string,
    query: ExecutionRequestTenantQueryDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestDemoExecuteResponseDto> {
    return this.executionRequestDemoExecutorService.demoExecute(executionRequestId, query, actor);
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

  private toResponse(executionRequest: ExecutionRequestRecord): ExecutionRequestResponseDto {
    return {
      id: executionRequest.id,
      tenantId: executionRequest.tenantId,
      requestKey: executionRequest.requestKey,
      kind: executionRequest.kind,
      status: executionRequest.status,
      queryDefinitionId: executionRequest.queryDefinitionId,
      dashboardDefinitionId: executionRequest.dashboardDefinitionId,
      reportDefinitionId: executionRequest.reportDefinitionId,
      connectionId: executionRequest.connectionId,
      datasetId: executionRequest.datasetId,
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
