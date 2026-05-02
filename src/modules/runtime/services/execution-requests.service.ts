import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import { DatasetStatus } from '../../datasets/schemas/dataset.schema';
import { DatasetsService } from '../../datasets/services/datasets.service';
import { FieldMappingStatus } from '../../field-mappings/schemas/field-mapping.schema';
import { FieldMappingsService } from '../../field-mappings/services/field-mappings.service';
import { QueryDefinitionStatus } from '../../query-definitions/schemas/query-definition.schema';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import { ReportDefinitionsService } from '../../report-definitions/services/report-definitions.service';
import { CreateExecutionRequestDto } from '../dto/create-execution-request.dto';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import {
  ExecutionRequestDryRunResponseDto,
  ExecutionRequestReadinessItemDto,
} from '../dto/execution-request-dry-run-response.dto';
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

interface ReadinessAccumulator {
  checks: ExecutionRequestReadinessItemDto[];
  warnings: ExecutionRequestReadinessItemDto[];
  blockers: ExecutionRequestReadinessItemDto[];
}

@Injectable()
export class ExecutionRequestsService {
  constructor(
    private readonly executionRequestsRepository: ExecutionRequestsRepository,
    private readonly executionRequestEventsRepository: ExecutionRequestEventsRepository,
    private readonly auditService: AuditService,
    private readonly queryDefinitionsService: QueryDefinitionsService,
    private readonly dashboardDefinitionsService: DashboardDefinitionsService,
    private readonly reportDefinitionsService: ReportDefinitionsService,
    private readonly datasetsService: DatasetsService,
    private readonly fieldMappingsService: FieldMappingsService,
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

  async dryRun(
    executionRequestId: string,
    query: ExecutionRequestTenantQueryDto,
    actor: ExecutionRequestActorContext = {},
  ): Promise<ExecutionRequestDryRunResponseDto> {
    const executionRequest = await this.getExecutionRequestOrThrow(
      query.tenantId,
      executionRequestId,
    );
    const readiness = await this.evaluateReadiness(executionRequest);
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
          executionRequest._id.toString(),
          recommendedStatus,
        )) ?? executionRequest;
    }

    const message = ready
      ? 'Dry-run readiness passed declarative checks. No real runtime execution was started.'
      : 'Dry-run readiness found declarative blockers. No real runtime execution was started.';
    const event = await this.executionRequestEventsRepository.create({
      tenantId: executionRequest.tenantId,
      executionRequestId: executionRequest._id,
      requestKey: executionRequest.requestKey,
      eventType: ready ? ExecutionRequestEventType.Accepted : ExecutionRequestEventType.Blocked,
      previousStatus,
      nextStatus: recommendedStatus,
      message,
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

    await this.recordEventAudit(event, actor);
    await this.recordDryRunAudit(updatedExecutionRequest, actor, {
      ready,
      blockersCount: readiness.blockers.length,
      warningsCount: readiness.warnings.length,
      nextStatus: recommendedStatus,
    });

    if (recommendedStatus !== previousStatus) {
      await this.recordAudit('execution_request.status_changed', updatedExecutionRequest, actor, {
        eventType: event.eventType,
        previousStatus,
        nextStatus: recommendedStatus,
      });
    }

    return {
      executionRequestId: executionRequest._id.toString(),
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

  private async evaluateReadiness(
    executionRequest: ExecutionRequestDocument,
  ): Promise<ReadinessAccumulator> {
    switch (executionRequest.kind) {
      case ExecutionRequestKind.Query:
        return this.evaluateQueryReadiness(
          executionRequest.tenantId.toString(),
          executionRequest.queryDefinitionId?.toString(),
          'executionRequest.queryDefinitionId',
        );
      case ExecutionRequestKind.Dashboard:
        return this.evaluateDashboardReadiness(
          executionRequest.tenantId.toString(),
          executionRequest.dashboardDefinitionId?.toString(),
          'executionRequest.dashboardDefinitionId',
        );
      case ExecutionRequestKind.Report:
        return this.evaluateReportReadiness(
          executionRequest.tenantId.toString(),
          executionRequest.reportDefinitionId?.toString(),
          'executionRequest.reportDefinitionId',
        );
    }
  }

  private async evaluateQueryReadiness(
    tenantId: string,
    queryDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!queryDefinitionId) {
      this.addBlocker(
        readiness,
        'query_definition_id_missing',
        'queryDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'query_definition_id_present',
      'queryDefinitionId is configured.',
      target,
    );
    const queryDefinition = await this.findQueryDefinition(tenantId, queryDefinitionId);

    if (!queryDefinition) {
      this.addBlocker(
        readiness,
        'query_definition_not_found',
        'Query definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'query_definition_found',
      'Query definition exists for this tenant.',
      target,
    );

    if (queryDefinition.status !== QueryDefinitionStatus.Active) {
      this.addWarning(
        readiness,
        'query_definition_not_active',
        'Query definition status is not active.',
        target,
      );
    }

    await this.evaluateDatasetReadiness(
      tenantId,
      queryDefinition.datasetId,
      readiness,
      `${target}.datasetId`,
    );

    return readiness;
  }

  private async evaluateDatasetReadiness(
    tenantId: string,
    datasetId: string | undefined,
    readiness: ReadinessAccumulator,
    target: string,
  ): Promise<void> {
    if (!datasetId) {
      this.addBlocker(
        readiness,
        'dataset_id_missing',
        'datasetId is required by the query definition.',
        target,
      );
      return;
    }

    this.addCheck(readiness, 'dataset_id_present', 'datasetId is configured.', target);
    const dataset = await this.findDataset(tenantId, datasetId);

    if (!dataset) {
      this.addBlocker(
        readiness,
        'dataset_not_found',
        'Dataset was not found for this tenant.',
        target,
      );
      return;
    }

    this.addCheck(readiness, 'dataset_found', 'Dataset exists for this tenant.', target);

    if (dataset.status !== DatasetStatus.Active) {
      this.addWarning(readiness, 'dataset_not_active', 'Dataset status is not active.', target);
    }

    if (!dataset.datasetKey) {
      this.addBlocker(
        readiness,
        'dataset_key_missing',
        'Dataset key is required for field mappings.',
        target,
      );
      return;
    }

    this.addCheck(
      readiness,
      'dataset_key_present',
      'Dataset key is configured.',
      `${target}.datasetKey`,
    );
    const mappings = await this.fieldMappingsService.findByFilters({
      tenantId,
      datasetKey: dataset.datasetKey,
      page: 1,
      pageSize: 1000,
    });

    if (mappings.items.length === 0) {
      this.addBlocker(
        readiness,
        'field_mappings_missing',
        'No field mappings are configured for this dataset key.',
        `${target}.fieldMappings`,
      );
      return;
    }

    this.addCheck(
      readiness,
      'field_mappings_found',
      'Field mappings exist for this dataset key.',
      `${target}.fieldMappings`,
    );

    const inactiveCount = mappings.items.filter(
      (mapping) => mapping.status !== FieldMappingStatus.Active,
    ).length;

    if (inactiveCount > 0) {
      this.addWarning(
        readiness,
        'field_mappings_incomplete',
        'Some field mappings are not active.',
        `${target}.fieldMappings`,
      );
    }
  }

  private async evaluateDashboardReadiness(
    tenantId: string,
    dashboardDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!dashboardDefinitionId) {
      this.addBlocker(
        readiness,
        'dashboard_definition_id_missing',
        'dashboardDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_definition_id_present',
      'dashboardDefinitionId is configured.',
      target,
    );
    const dashboardDefinition = await this.findDashboardDefinition(tenantId, dashboardDefinitionId);

    if (!dashboardDefinition) {
      this.addBlocker(
        readiness,
        'dashboard_definition_not_found',
        'Dashboard definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_definition_found',
      'Dashboard definition exists for this tenant.',
      target,
    );

    if (dashboardDefinition.widgets.length === 0) {
      this.addBlocker(
        readiness,
        'dashboard_widgets_missing',
        'Dashboard has no widgets configured.',
        `${target}.widgets`,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_widgets_found',
      'Dashboard widgets are configured.',
      `${target}.widgets`,
    );
    let resolvableWidgetsCount = 0;

    for (const widget of dashboardDefinition.widgets) {
      const widgetTarget = `${target}.widgets.${widget.key}`;

      if (!widget.queryDefinitionId) {
        this.addWarning(
          readiness,
          'dashboard_widget_query_missing',
          'Dashboard widget has no queryDefinitionId.',
          widgetTarget,
        );
        continue;
      }

      resolvableWidgetsCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateQueryReadiness(tenantId, widget.queryDefinitionId, widgetTarget),
      );
    }

    if (resolvableWidgetsCount === 0) {
      this.addBlocker(
        readiness,
        'dashboard_has_no_resolvable_queries',
        'Dashboard has no widgets with a queryDefinitionId.',
        `${target}.widgets`,
      );
    }

    return readiness;
  }

  private async evaluateReportReadiness(
    tenantId: string,
    reportDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!reportDefinitionId) {
      this.addBlocker(
        readiness,
        'report_definition_id_missing',
        'reportDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'report_definition_id_present',
      'reportDefinitionId is configured.',
      target,
    );
    const reportDefinition = await this.findReportDefinition(tenantId, reportDefinitionId);

    if (!reportDefinition) {
      this.addBlocker(
        readiness,
        'report_definition_not_found',
        'Report definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'report_definition_found',
      'Report definition exists for this tenant.',
      target,
    );
    let resolvableReferencesCount = 0;

    if (reportDefinition.queryDefinitionId) {
      resolvableReferencesCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateQueryReadiness(
          tenantId,
          reportDefinition.queryDefinitionId,
          `${target}.queryDefinitionId`,
        ),
      );
    }

    if (reportDefinition.dashboardDefinitionId) {
      resolvableReferencesCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateDashboardReadiness(
          tenantId,
          reportDefinition.dashboardDefinitionId,
          `${target}.dashboardDefinitionId`,
        ),
      );
    }

    for (const block of reportDefinition.blocks) {
      const blockTarget = `${target}.blocks.${block.key}`;

      if (block.queryDefinitionId) {
        resolvableReferencesCount += 1;
        this.mergeReadiness(
          readiness,
          await this.evaluateQueryReadiness(tenantId, block.queryDefinitionId, blockTarget),
        );
        continue;
      }

      if (block.dashboardDefinitionId) {
        resolvableReferencesCount += 1;
        this.mergeReadiness(
          readiness,
          await this.evaluateDashboardReadiness(tenantId, block.dashboardDefinitionId, blockTarget),
        );
        continue;
      }

      this.addWarning(
        readiness,
        'report_block_reference_missing',
        'Report block has no query or dashboard reference.',
        blockTarget,
      );
    }

    if (Object.keys(reportDefinition.exportOptions).length > 0) {
      this.addCheck(
        readiness,
        'report_export_options_declarative',
        'Export options are declarative only and no file will be generated.',
        `${target}.exportOptions`,
      );
    }

    if (resolvableReferencesCount === 0) {
      this.addBlocker(
        readiness,
        'report_has_no_resolvable_reference',
        'Report has no queryDefinitionId or dashboardDefinitionId to validate declaratively.',
        target,
      );
    }

    return readiness;
  }

  private createReadinessAccumulator(): ReadinessAccumulator {
    return {
      checks: [],
      warnings: [],
      blockers: [],
    };
  }

  private mergeReadiness(target: ReadinessAccumulator, source: ReadinessAccumulator): void {
    target.checks.push(...source.checks);
    target.warnings.push(...source.warnings);
    target.blockers.push(...source.blockers);
  }

  private addCheck(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.checks.push({ code, message, target });
  }

  private addWarning(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.warnings.push({ code, message, target });
  }

  private addBlocker(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.blockers.push({ code, message, target });
  }

  private async findQueryDefinition(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<Awaited<ReturnType<QueryDefinitionsService['findOne']>> | null> {
    try {
      return await this.queryDefinitionsService.findOne(tenantId, queryDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findDataset(
    tenantId: string,
    datasetId: string,
  ): Promise<Awaited<ReturnType<DatasetsService['findOne']>> | null> {
    try {
      return await this.datasetsService.findOne(tenantId, datasetId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findDashboardDefinition(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<Awaited<ReturnType<DashboardDefinitionsService['findOne']>> | null> {
    try {
      return await this.dashboardDefinitionsService.findOne(tenantId, dashboardDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findReportDefinition(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<Awaited<ReturnType<ReportDefinitionsService['findOne']>> | null> {
    try {
      return await this.reportDefinitionsService.findOne(tenantId, reportDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
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

  private async recordDryRunAudit(
    executionRequest: ExecutionRequestDocument,
    actor: ExecutionRequestActorContext,
    metadata: {
      ready: boolean;
      blockersCount: number;
      warningsCount: number;
      nextStatus: ExecutionRequestStatus;
    },
  ): Promise<void> {
    await this.auditService.record({
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
