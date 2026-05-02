import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import {
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../../datasets/schemas/dataset.schema';
import { DatasetsService } from '../../datasets/services/datasets.service';
import {
  FieldMappingStatus,
  FieldMappingTargetType,
} from '../../field-mappings/schemas/field-mapping.schema';
import { FieldMappingsService } from '../../field-mappings/services/field-mappings.service';
import {
  QueryDefinitionStatus,
  QueryDefinitionType,
} from '../../query-definitions/schemas/query-definition.schema';
import {
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../../dashboard-definitions/schemas/dashboard-definition.schema';
import {
  ReportDefinitionLayoutType,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../../report-definitions/schemas/report-definition.schema';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import { ReportDefinitionsService } from '../../report-definitions/services/report-definitions.service';
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
import { ExecutionRequestsService } from '../services/execution-requests.service';

type AuditServiceMock = {
  record: jest.Mock<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>;
};

type DeclarativeServicesMock = {
  queryDefinitionsService: Pick<QueryDefinitionsService, 'findOne'>;
  dashboardDefinitionsService: Pick<DashboardDefinitionsService, 'findOne'>;
  reportDefinitionsService: Pick<ReportDefinitionsService, 'findOne'>;
  datasetsService: Pick<DatasetsService, 'findOne'>;
  fieldMappingsService: Pick<FieldMappingsService, 'findByFilters'>;
};

describe('ExecutionRequestsService', () => {
  it.each([
    {
      kind: ExecutionRequestKind.Query,
      referenceField: 'queryDefinitionId',
      referenceId: new Types.ObjectId(),
    },
    {
      kind: ExecutionRequestKind.Dashboard,
      referenceField: 'dashboardDefinitionId',
      referenceId: new Types.ObjectId(),
    },
    {
      kind: ExecutionRequestKind.Report,
      referenceField: 'reportDefinitionId',
      referenceId: new Types.ObjectId(),
    },
  ] as const)('creates a $kind execution request foundation record', async (caseData) => {
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const connectionId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T12:00:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestDocument({
          _id: record._id,
          tenantId: record.tenantId,
          requestKey: record.requestKey,
          kind: record.kind,
          status: record.status,
          queryDefinitionId: record.queryDefinitionId,
          dashboardDefinitionId: record.dashboardDefinitionId,
          reportDefinitionId: record.reportDefinitionId,
          connectionId: record.connectionId,
          datasetId: record.datasetId,
          requestedByActorId: record.requestedByActorId,
          requestedByRole: record.requestedByRole,
          mode: record.mode,
          reason: record.reason,
          message: record.message,
          metadata: record.metadata,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId: record.tenantId,
          executionRequestId: record.executionRequestId,
          requestKey: record.requestKey,
          eventType: record.eventType,
          previousStatus: record.previousStatus,
          nextStatus: record.nextStatus,
          reason: record.reason,
          message: record.message,
          actorId: record.actorId,
          actorRole: record.actorRole,
          metadata: record.metadata,
          createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, eventRepository, auditService);

    const result = await service.create(
      {
        tenantId: tenantId.toString(),
        kind: caseData.kind,
        [caseData.referenceField]: caseData.referenceId.toString(),
        connectionId: connectionId.toString(),
        datasetId: datasetId.toString(),
        mode: ExecutionRequestMode.FutureRuntime,
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
          authorization: 'Bearer must-not-leak-token',
        },
      },
      {
        actorId: '662d4f6e7a1c2b00124f0999',
        actorRole: AdminRole.Operator,
      },
    );

    const createRecord = jest.mocked(repository.create).mock.calls[0]?.[0];

    if (!createRecord) {
      throw new Error('Expected create repository call.');
    }

    expect(createRecord.tenantId).toEqual(tenantId);
    expect(createRecord.requestKey).toMatch(/^exec_req_[0-9a-f]{24}$/);
    expect(createRecord.kind).toBe(caseData.kind);
    expect(createRecord.status).toBe(ExecutionRequestStatus.Accepted);
    expect(createRecord[caseData.referenceField]).toEqual(caseData.referenceId);
    expect(createRecord.connectionId).toEqual(connectionId);
    expect(createRecord.datasetId).toEqual(datasetId);
    expect(createRecord.requestedByActorId).toBe('662d4f6e7a1c2b00124f0999');
    expect(createRecord.requestedByRole).toBe(AdminRole.Operator);
    expect(createRecord.mode).toBe(ExecutionRequestMode.FutureRuntime);
    expect(createRecord.reason).toBe('runtime_foundation_only');
    expect(createRecord.metadata).toEqual({ domain: 'sales' });
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        executionRequestId: createRecord._id,
        requestKey: createRecord.requestKey,
        eventType: ExecutionRequestEventType.Accepted,
        nextStatus: ExecutionRequestStatus.Accepted,
        reason: 'runtime_foundation_only',
        metadata: {},
      }),
    );
    expect(result.requestKey).toMatch(/^exec_req_[0-9a-f]{24}$/);
    expect(result[caseData.referenceField]).toBe(caseData.referenceId.toString());
    expect(result).toMatchObject({
      tenantId: tenantId.toString(),
      kind: caseData.kind,
      status: ExecutionRequestStatus.Accepted,
      connectionId: connectionId.toString(),
      datasetId: datasetId.toString(),
      requestedByRole: AdminRole.Operator,
      mode: ExecutionRequestMode.FutureRuntime,
      reason: 'runtime_foundation_only',
      message: 'Runtime foundation request accepted. No real execution was started.',
      metadata: { domain: 'sales' },
    });
    const auditRecord = auditService.record.mock.calls[0]?.[0];
    const eventAuditRecord = auditService.record.mock.calls[1]?.[0];

    if (!auditRecord || !eventAuditRecord) {
      throw new Error('Expected audit record call.');
    }

    expect(auditRecord).toMatchObject({
      tenantId: tenantId.toString(),
      actorUserId: '662d4f6e7a1c2b00124f0999',
      action: 'execution_request.created',
      entity: 'execution_request',
      entityId: result.id,
    });
    expect(auditRecord.metadata).toMatchObject({
      tenantId: tenantId.toString(),
      kind: caseData.kind,
      status: ExecutionRequestStatus.Accepted,
      actorId: '662d4f6e7a1c2b00124f0999',
      actorRole: AdminRole.Operator,
    });
    expect(eventAuditRecord).toMatchObject({
      tenantId: tenantId.toString(),
      actorUserId: '662d4f6e7a1c2b00124f0999',
      action: 'execution_request.event.created',
      entity: 'execution_request_event',
    });
    expect(eventAuditRecord.metadata).toMatchObject({
      executionRequestId: result.id,
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('returns validation errors when kind does not have its required reference', async () => {
    const service = createService({ create: jest.fn() });

    await expect(
      service.create({
        tenantId: new Types.ObjectId().toString(),
        kind: ExecutionRequestKind.Query,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists execution requests by tenant scoped filters', async () => {
    const tenantId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T12:30:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createExecutionRequestDocument({
          _id: new Types.ObjectId(),
          tenantId,
          requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          queryDefinitionId,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository);

    const result = await service.findByFilters({
      tenantId: tenantId.toString(),
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: queryDefinitionId.toString(),
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        kind: ExecutionRequestKind.Query,
        status: ExecutionRequestStatus.Accepted,
        mode: undefined,
        queryDefinitionId,
        dashboardDefinitionId: undefined,
        reportDefinitionId: undefined,
        connectionId: undefined,
        datasetId: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('reads one execution request using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(
      service.findOne(tenantId.toString(), executionRequestId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
    );
  });

  it('lists events by execution request and tenant scope', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T13:00:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          _id: executionRequestId,
          tenantId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const eventRepository: Pick<
      ExecutionRequestEventsRepository,
      'findByFilters' | 'countByFilters'
    > = {
      findByFilters: jest.fn(async () => [
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId,
          executionRequestId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          eventType: ExecutionRequestEventType.Accepted,
          nextStatus: ExecutionRequestStatus.Accepted,
          metadata: {},
          createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository, eventRepository);

    const result = await service.findEvents(executionRequestId.toString(), {
      tenantId: tenantId.toString(),
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
    );
    expect(eventRepository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        executionRequestId,
        eventType: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      executionRequestId: executionRequestId.toString(),
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
    });
  });

  it('creates a safe status event and updates execution request status', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T13:30:00.000Z');
    const request = createExecutionRequestDocument({
      _id: executionRequestId,
      tenantId,
      requestKey: `exec_req_${executionRequestId.toString()}`,
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
      createdAt,
      updatedAt: createdAt,
    });
    const repository: Pick<
      ExecutionRequestsRepository,
      'findByTenantAndId' | 'updateStatusByTenantAndId'
    > = {
      findByTenantAndId: jest.fn(async () => request),
      updateStatusByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          ...request,
          status: ExecutionRequestStatus.Blocked,
          updatedAt: new Date('2026-05-02T13:31:00.000Z'),
        }),
      ),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId: record.tenantId,
          executionRequestId: record.executionRequestId,
          requestKey: record.requestKey,
          eventType: record.eventType,
          previousStatus: record.previousStatus,
          nextStatus: record.nextStatus,
          message: record.message,
          reason: record.reason,
          actorId: record.actorId,
          actorRole: record.actorRole,
          metadata: record.metadata,
          createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, eventRepository, auditService);

    const result = await service.createEvent(
      executionRequestId.toString(),
      {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.Blocked,
        message: 'Blocked by foundation policy.',
        reason: 'runtime_foundation_only',
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
          authorization: 'Bearer must-not-leak-token',
        },
      },
      {
        actorId: '662d4f6e7a1c2b00124f0999',
        actorRole: AdminRole.Operator,
      },
    );

    expect(repository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
      ExecutionRequestStatus.Blocked,
    );
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.Blocked,
        previousStatus: ExecutionRequestStatus.Accepted,
        nextStatus: ExecutionRequestStatus.Blocked,
        message: 'Blocked by foundation policy.',
        reason: 'runtime_foundation_only',
        metadata: { domain: 'sales' },
      }),
    );
    expect(result).toMatchObject({
      executionRequestId: executionRequestId.toString(),
      eventType: ExecutionRequestEventType.Blocked,
      previousStatus: ExecutionRequestStatus.Accepted,
      nextStatus: ExecutionRequestStatus.Blocked,
      metadata: { domain: 'sales' },
    });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'execution_request.event.created',
        entity: 'execution_request_event',
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'execution_request.status_changed',
        entity: 'execution_request',
      }),
    );
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('rejects invalid event transition payloads', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const service = createService({
      findByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          _id: executionRequestId,
          tenantId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt: new Date('2026-05-02T14:00:00.000Z'),
          updatedAt: new Date('2026-05-02T14:00:00.000Z'),
        }),
      ),
    });

    await expect(
      service.createEvent(executionRequestId.toString(), {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.StatusChanged,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('runs a ready query dry-run without exposing secrets or starting runtime execution', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [createFieldMappingResponse()],
    });

    const result = await harness.service.dryRun(
      harness.executionRequestId.toString(),
      { tenantId: harness.tenantId.toString() },
      { actorId: '662d4f6e7a1c2b00124f0999', actorRole: AdminRole.Operator },
    );

    expect(result).toMatchObject({
      executionRequestId: harness.executionRequestId.toString(),
      requestKey: `exec_req_${harness.executionRequestId.toString()}`,
      kind: ExecutionRequestKind.Query,
      recommendedStatus: ExecutionRequestStatus.Accepted,
      ready: true,
      mode: ExecutionRequestMode.DryRun,
      reason: 'dry_run_readiness_checked',
    });
    expect(result.message).toContain('No real runtime execution was started.');
    expect(result.blockers).toEqual([]);
    expect(result.checks.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'query_definition_found',
        'dataset_found',
        'dataset_key_present',
        'field_mappings_found',
      ]),
    );
    expect(harness.queryDefinitionsService.findOne).toHaveBeenCalledWith(
      harness.tenantId.toString(),
      harness.queryDefinitionId.toString(),
    );
    expect(harness.datasetsService.findOne).toHaveBeenCalledWith(
      harness.tenantId.toString(),
      harness.datasetId.toString(),
    );
    expect(harness.fieldMappingsService.findByFilters).toHaveBeenCalledWith({
      tenantId: harness.tenantId.toString(),
      datasetKey: 'sales_orders',
      page: 1,
      pageSize: 1000,
    });
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).not.toHaveBeenCalled();
    expect(harness.eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.Accepted,
        previousStatus: ExecutionRequestStatus.Accepted,
        nextStatus: ExecutionRequestStatus.Accepted,
        reason: 'dry_run_readiness_checked',
        metadata: {
          mode: ExecutionRequestMode.DryRun,
          kind: ExecutionRequestKind.Query,
          ready: true,
          checksCount: 6,
          warningsCount: 0,
          blockersCount: 0,
          nextStatus: ExecutionRequestStatus.Accepted,
        },
      }),
    );
    const dryRunAuditRecord = harness.auditService.record.mock.calls
      .map(([record]) => record)
      .find((record) => record.action === 'execution_request.dry_run_checked');

    expect(dryRunAuditRecord).toBeDefined();
    expect(dryRunAuditRecord?.metadata).toMatchObject({
      tenantId: harness.tenantId.toString(),
      executionRequestId: harness.executionRequestId.toString(),
      requestKey: `exec_req_${harness.executionRequestId.toString()}`,
      kind: ExecutionRequestKind.Query,
      ready: true,
      blockersCount: 0,
      warningsCount: 0,
      nextStatus: ExecutionRequestStatus.Accepted,
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(harness.auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('blocks query dry-run when queryDefinitionId is missing and creates a timeline event', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      missingQueryDefinitionId: true,
    });

    const result = await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(result.ready).toBe(false);
    expect(result.recommendedStatus).toBe(ExecutionRequestStatus.Blocked);
    expect(result.blockers).toContainEqual(
      expect.objectContaining({ code: 'query_definition_id_missing' }),
    );
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId.toString(),
      ExecutionRequestStatus.Blocked,
    );
    expect(harness.eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.Blocked,
        nextStatus: ExecutionRequestStatus.Blocked,
        reason: 'dry_run_readiness_checked',
      }),
    );
  });

  it('blocks query dry-run when query definition does not exist for the tenant', async () => {
    const harness = createDryRunHarness({ kind: ExecutionRequestKind.Query });

    const result = await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContainEqual(
      expect.objectContaining({ code: 'query_definition_not_found' }),
    );
    expect(harness.queryDefinitionsService.findOne).toHaveBeenCalledWith(
      harness.tenantId.toString(),
      harness.queryDefinitionId.toString(),
    );
  });

  it('blocks query dry-run when the query has no dataset reference', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse({
        datasetId: undefined as unknown as string,
      }),
    });

    const result = await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContainEqual(expect.objectContaining({ code: 'dataset_id_missing' }));
  });

  it('blocks query dry-run when the dataset is missing or has no field mappings', async () => {
    const missingDataset = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse(),
    });
    const datasetWithoutMappings = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [],
    });

    const missingDatasetResult = await missingDataset.service.dryRun(
      missingDataset.executionRequestId.toString(),
      { tenantId: missingDataset.tenantId.toString() },
    );
    const datasetWithoutMappingsResult = await datasetWithoutMappings.service.dryRun(
      datasetWithoutMappings.executionRequestId.toString(),
      { tenantId: datasetWithoutMappings.tenantId.toString() },
    );

    expect(missingDatasetResult.blockers).toContainEqual(
      expect.objectContaining({ code: 'dataset_not_found' }),
    );
    expect(datasetWithoutMappingsResult.blockers).toContainEqual(
      expect.objectContaining({ code: 'field_mappings_missing' }),
    );
  });

  it('warns when query dry-run finds incomplete field mappings', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [
        createFieldMappingResponse({ status: FieldMappingStatus.Active }),
        createFieldMappingResponse({ status: FieldMappingStatus.Inactive }),
      ],
    });

    const result = await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(result.ready).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'field_mappings_incomplete' }),
    );
  });

  it('runs dashboard dry-run with widgets and resolvable queries', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Dashboard,
      dashboardDefinition: createDashboardDefinitionResponse(),
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [createFieldMappingResponse()],
    });

    const result = await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(result.ready).toBe(true);
    expect(result.checks).toContainEqual(
      expect.objectContaining({ code: 'dashboard_definition_found' }),
    );
    expect(result.checks).toContainEqual(
      expect.objectContaining({ code: 'query_definition_found' }),
    );
  });

  it('blocks dashboard dry-run with no widgets or no widget query references', async () => {
    const noWidgets = createDryRunHarness({
      kind: ExecutionRequestKind.Dashboard,
      dashboardDefinition: createDashboardDefinitionResponse({ widgets: [] }),
    });
    const noWidgetQueries = createDryRunHarness({
      kind: ExecutionRequestKind.Dashboard,
      dashboardDefinition: createDashboardDefinitionResponse({
        widgets: [
          {
            key: 'kpi_text',
            title: 'KPI text',
            type: DashboardDefinitionWidgetType.Text,
            order: 1,
            options: {},
          },
        ],
      }),
    });

    const noWidgetsResult = await noWidgets.service.dryRun(
      noWidgets.executionRequestId.toString(),
      {
        tenantId: noWidgets.tenantId.toString(),
      },
    );
    const noWidgetQueriesResult = await noWidgetQueries.service.dryRun(
      noWidgetQueries.executionRequestId.toString(),
      { tenantId: noWidgetQueries.tenantId.toString() },
    );

    expect(noWidgetsResult.blockers).toContainEqual(
      expect.objectContaining({ code: 'dashboard_widgets_missing' }),
    );
    expect(noWidgetQueriesResult.warnings).toContainEqual(
      expect.objectContaining({ code: 'dashboard_widget_query_missing' }),
    );
    expect(noWidgetQueriesResult.blockers).toContainEqual(
      expect.objectContaining({ code: 'dashboard_has_no_resolvable_queries' }),
    );
  });

  it('runs report dry-run with query, dashboard, or no useful reference', async () => {
    const withQuery = createDryRunHarness({
      kind: ExecutionRequestKind.Report,
      reportDefinition: createReportDefinitionResponse(),
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [createFieldMappingResponse()],
    });
    const withDashboard = createDryRunHarness({
      kind: ExecutionRequestKind.Report,
      reportDefinition: createReportDefinitionResponse({
        queryDefinitionId: undefined,
        dashboardDefinitionId: withQuery.dashboardDefinitionId.toString(),
      }),
      dashboardDefinition: createDashboardDefinitionResponse(),
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [createFieldMappingResponse()],
    });
    const withoutReference = createDryRunHarness({
      kind: ExecutionRequestKind.Report,
      reportDefinition: createReportDefinitionResponse({
        queryDefinitionId: undefined,
        dashboardDefinitionId: undefined,
        blocks: [],
      }),
    });

    const withQueryResult = await withQuery.service.dryRun(
      withQuery.executionRequestId.toString(),
      {
        tenantId: withQuery.tenantId.toString(),
      },
    );
    const withDashboardResult = await withDashboard.service.dryRun(
      withDashboard.executionRequestId.toString(),
      { tenantId: withDashboard.tenantId.toString() },
    );
    const withoutReferenceResult = await withoutReference.service.dryRun(
      withoutReference.executionRequestId.toString(),
      { tenantId: withoutReference.tenantId.toString() },
    );

    expect(withQueryResult.ready).toBe(true);
    expect(withQueryResult.checks).toContainEqual(
      expect.objectContaining({ code: 'report_export_options_declarative' }),
    );
    expect(withDashboardResult.ready).toBe(true);
    expect(withDashboardResult.checks).toContainEqual(
      expect.objectContaining({ code: 'dashboard_definition_found' }),
    );
    expect(withoutReferenceResult.ready).toBe(false);
    expect(withoutReferenceResult.blockers).toContainEqual(
      expect.objectContaining({ code: 'report_has_no_resolvable_reference' }),
    );
  });

  it('keeps dry-run tenant scoped and updates blocked status after readiness failure', async () => {
    const harness = createDryRunHarness({ kind: ExecutionRequestKind.Query });

    await harness.service.dryRun(harness.executionRequestId.toString(), {
      tenantId: harness.tenantId.toString(),
    });

    expect(harness.executionRequestsRepository.findByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId.toString(),
    );
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId.toString(),
      ExecutionRequestStatus.Blocked,
    );
  });
});

function createService(
  repository: Partial<ExecutionRequestsRepository>,
  eventRepository: Partial<ExecutionRequestEventsRepository> = createEventRepository(),
  auditService: AuditServiceMock = createAuditService(),
  declarativeServices: DeclarativeServicesMock = createDeclarativeServices(),
): ExecutionRequestsService {
  return new ExecutionRequestsService(
    repository as ExecutionRequestsRepository,
    eventRepository as ExecutionRequestEventsRepository,
    auditService as unknown as AuditService,
    declarativeServices.queryDefinitionsService as QueryDefinitionsService,
    declarativeServices.dashboardDefinitionsService as DashboardDefinitionsService,
    declarativeServices.reportDefinitionsService as ReportDefinitionsService,
    declarativeServices.datasetsService as DatasetsService,
    declarativeServices.fieldMappingsService as FieldMappingsService,
  );
}

function createEventRepository(): Partial<ExecutionRequestEventsRepository> {
  return {
    create: jest.fn(),
    findByFilters: jest.fn(),
    countByFilters: jest.fn(),
  };
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>(
      async () => ({
        id: new Types.ObjectId().toString(),
        tenantId: new Types.ObjectId().toString(),
        action: 'execution_request.created',
        entity: 'execution_request',
        metadata: {},
        timestamp: new Date().toISOString(),
      }),
    ),
  };
}

function createDeclarativeServices(
  overrides: Partial<DeclarativeServicesMock> = {},
): DeclarativeServicesMock {
  return {
    queryDefinitionsService: {
      findOne: jest.fn(async () => {
        throw new NotFoundException('Query definition not found.');
      }),
    },
    dashboardDefinitionsService: {
      findOne: jest.fn(async () => {
        throw new NotFoundException('Dashboard definition not found.');
      }),
    },
    reportDefinitionsService: {
      findOne: jest.fn(async () => {
        throw new NotFoundException('Report definition not found.');
      }),
    },
    datasetsService: {
      findOne: jest.fn(async () => {
        throw new NotFoundException('Dataset not found.');
      }),
    },
    fieldMappingsService: {
      findByFilters: jest.fn(async () => ({
        items: [],
        meta: { page: 1, pageSize: 1000, total: 0, totalPages: 0 },
      })),
    },
    ...overrides,
  };
}

function createExecutionRequestDocument(
  record: Partial<ExecutionRequestDocument>,
): ExecutionRequestDocument {
  return record as ExecutionRequestDocument;
}

function createExecutionRequestEventDocument(
  record: Partial<ExecutionRequestEventDocument>,
): ExecutionRequestEventDocument {
  return record as ExecutionRequestEventDocument;
}

interface DryRunHarnessOptions {
  kind: ExecutionRequestKind;
  status?: ExecutionRequestStatus;
  queryDefinitionId?: Types.ObjectId;
  dashboardDefinitionId?: Types.ObjectId;
  reportDefinitionId?: Types.ObjectId;
  missingQueryDefinitionId?: boolean;
  missingDashboardDefinitionId?: boolean;
  missingReportDefinitionId?: boolean;
  queryDefinition?: Awaited<ReturnType<QueryDefinitionsService['findOne']>>;
  dashboardDefinition?: Awaited<ReturnType<DashboardDefinitionsService['findOne']>>;
  reportDefinition?: Awaited<ReturnType<ReportDefinitionsService['findOne']>>;
  dataset?: Awaited<ReturnType<DatasetsService['findOne']>>;
  fieldMappings?: Awaited<ReturnType<FieldMappingsService['findByFilters']>>['items'];
}

function createDryRunHarness(options: DryRunHarnessOptions) {
  const tenantId = new Types.ObjectId();
  const executionRequestId = new Types.ObjectId();
  const queryDefinitionId = options.queryDefinitionId ?? new Types.ObjectId();
  const dashboardDefinitionId = options.dashboardDefinitionId ?? new Types.ObjectId();
  const reportDefinitionId = options.reportDefinitionId ?? new Types.ObjectId();
  const datasetId = new Types.ObjectId('662d4f6e7a1c2b00124f0501');
  const createdAt = new Date('2026-05-02T15:00:00.000Z');
  const executionRequest = createExecutionRequestDocument({
    _id: executionRequestId,
    tenantId,
    requestKey: `exec_req_${executionRequestId.toString()}`,
    kind: options.kind,
    status: options.status ?? ExecutionRequestStatus.Accepted,
    queryDefinitionId: options.missingQueryDefinitionId ? undefined : queryDefinitionId,
    dashboardDefinitionId: options.missingDashboardDefinitionId ? undefined : dashboardDefinitionId,
    reportDefinitionId: options.missingReportDefinitionId ? undefined : reportDefinitionId,
    mode: ExecutionRequestMode.FutureRuntime,
    metadata: { domain: 'sales' },
    createdAt,
    updatedAt: createdAt,
  });
  const executionRequestsRepository: Pick<
    ExecutionRequestsRepository,
    'findByTenantAndId' | 'updateStatusByTenantAndId'
  > = {
    findByTenantAndId: jest.fn(async () => executionRequest),
    updateStatusByTenantAndId: jest.fn(async (_tenantId, _id, status) =>
      createExecutionRequestDocument({
        ...executionRequest,
        status,
        updatedAt: new Date('2026-05-02T15:01:00.000Z'),
      }),
    ),
  };
  const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
    create: jest.fn(async (record) =>
      createExecutionRequestEventDocument({
        _id: new Types.ObjectId(),
        tenantId: record.tenantId,
        executionRequestId: record.executionRequestId,
        requestKey: record.requestKey,
        eventType: record.eventType,
        previousStatus: record.previousStatus,
        nextStatus: record.nextStatus,
        message: record.message,
        reason: record.reason,
        actorId: record.actorId,
        actorRole: record.actorRole,
        metadata: record.metadata,
        createdAt,
      }),
    ),
  };
  const queryDefinition = options.queryDefinition
    ? {
        ...options.queryDefinition,
        id: queryDefinitionId.toString(),
        datasetId: Object.prototype.hasOwnProperty.call(options.queryDefinition, 'datasetId')
          ? options.queryDefinition.datasetId
          : datasetId.toString(),
      }
    : undefined;
  const dashboardDefinition = options.dashboardDefinition
    ? {
        ...options.dashboardDefinition,
        id: dashboardDefinitionId.toString(),
      }
    : undefined;
  const reportDefinition = options.reportDefinition
    ? {
        ...options.reportDefinition,
        id: reportDefinitionId.toString(),
      }
    : undefined;
  const dataset = options.dataset
    ? {
        ...options.dataset,
        id: datasetId.toString(),
      }
    : undefined;
  const queryDefinitionsService = {
    findOne: jest.fn(async () => {
      if (!queryDefinition) {
        throw new NotFoundException('Query definition not found.');
      }

      return queryDefinition;
    }),
  };
  const dashboardDefinitionsService = {
    findOne: jest.fn(async () => {
      if (!dashboardDefinition) {
        throw new NotFoundException('Dashboard definition not found.');
      }

      return dashboardDefinition;
    }),
  };
  const reportDefinitionsService = {
    findOne: jest.fn(async () => {
      if (!reportDefinition) {
        throw new NotFoundException('Report definition not found.');
      }

      return reportDefinition;
    }),
  };
  const datasetsService = {
    findOne: jest.fn(async () => {
      if (!dataset) {
        throw new NotFoundException('Dataset not found.');
      }

      return dataset;
    }),
  };
  const fieldMappingsService = {
    findByFilters: jest.fn(async () => ({
      items: options.fieldMappings ?? [],
      meta: {
        page: 1,
        pageSize: 1000,
        total: options.fieldMappings?.length ?? 0,
        totalPages: options.fieldMappings && options.fieldMappings.length > 0 ? 1 : 0,
      },
    })),
  };
  const auditService = createAuditService();
  const service = createService(executionRequestsRepository, eventRepository, auditService, {
    queryDefinitionsService,
    dashboardDefinitionsService,
    reportDefinitionsService,
    datasetsService,
    fieldMappingsService,
  });

  return {
    service,
    tenantId,
    executionRequestId,
    queryDefinitionId,
    dashboardDefinitionId,
    reportDefinitionId,
    datasetId,
    executionRequestsRepository,
    eventRepository,
    auditService,
    queryDefinitionsService,
    dashboardDefinitionsService,
    reportDefinitionsService,
    datasetsService,
    fieldMappingsService,
  };
}

function createQueryDefinitionResponse(
  overrides: Partial<Awaited<ReturnType<QueryDefinitionsService['findOne']>>> = {},
): Awaited<ReturnType<QueryDefinitionsService['findOne']>> {
  return {
    id: '662d4f6e7a1c2b00124f0601',
    tenantId: '662d4f6e7a1c2b00124f0001',
    datasetId: '662d4f6e7a1c2b00124f0501',
    queryKey: 'sales_overview',
    name: 'Sales overview',
    status: QueryDefinitionStatus.Active,
    type: QueryDefinitionType.Metric,
    metrics: [],
    dimensions: [],
    filters: [],
    sorts: [],
    allowedGranularities: [],
    tags: [],
    metadata: {},
    settings: {},
    createdAt: '2026-05-02T15:00:00.000Z',
    updatedAt: '2026-05-02T15:00:00.000Z',
    ...overrides,
  };
}

function createDatasetResponse(
  overrides: Partial<Awaited<ReturnType<DatasetsService['findOne']>>> = {},
): Awaited<ReturnType<DatasetsService['findOne']>> {
  return {
    id: '662d4f6e7a1c2b00124f0501',
    tenantId: '662d4f6e7a1c2b00124f0001',
    datasetKey: 'sales_orders',
    name: 'Sales orders',
    sourceType: DatasetSourceType.Api,
    status: DatasetStatus.Active,
    refreshMode: DatasetRefreshMode.Manual,
    schemaMode: DatasetSchemaMode.Declared,
    fields: [],
    primaryKeyFields: [],
    tags: [],
    metadata: {},
    settings: {},
    createdAt: '2026-05-02T15:00:00.000Z',
    updatedAt: '2026-05-02T15:00:00.000Z',
    ...overrides,
  };
}

function createFieldMappingResponse(
  overrides: Partial<
    Awaited<ReturnType<FieldMappingsService['findByFilters']>>['items'][number]
  > = {},
): Awaited<ReturnType<FieldMappingsService['findByFilters']>>['items'][number] {
  return {
    id: '662d4f6e7a1c2b00124f0301',
    tenantId: '662d4f6e7a1c2b00124f0001',
    datasetKey: 'sales_orders',
    sourcePath: 'order.total',
    targetField: 'totalAmount',
    targetType: FieldMappingTargetType.Money,
    required: true,
    status: FieldMappingStatus.Active,
    createdAt: '2026-05-02T15:00:00.000Z',
    updatedAt: '2026-05-02T15:00:00.000Z',
    ...overrides,
  };
}

function createDashboardDefinitionResponse(
  overrides: Partial<Awaited<ReturnType<DashboardDefinitionsService['findOne']>>> = {},
): Awaited<ReturnType<DashboardDefinitionsService['findOne']>> {
  return {
    id: '662d4f6e7a1c2b00124f0701',
    tenantId: '662d4f6e7a1c2b00124f0001',
    dashboardKey: 'sales_dashboard',
    name: 'Sales dashboard',
    status: DashboardDefinitionStatus.Active,
    visibility: DashboardDefinitionVisibility.Tenant,
    layout: { type: DashboardDefinitionLayoutType.Grid },
    sections: [],
    widgets: [
      {
        key: 'total_sales',
        title: 'Total sales',
        type: DashboardDefinitionWidgetType.MetricCard,
        queryDefinitionId: '662d4f6e7a1c2b00124f0601',
        order: 1,
        options: {},
      },
    ],
    filters: [],
    tags: [],
    metadata: {},
    settings: {},
    createdAt: '2026-05-02T15:00:00.000Z',
    updatedAt: '2026-05-02T15:00:00.000Z',
    ...overrides,
  };
}

function createReportDefinitionResponse(
  overrides: Partial<Awaited<ReturnType<ReportDefinitionsService['findOne']>>> = {},
): Awaited<ReturnType<ReportDefinitionsService['findOne']>> {
  return {
    id: '662d4f6e7a1c2b00124f0801',
    tenantId: '662d4f6e7a1c2b00124f0001',
    reportKey: 'monthly_sales',
    name: 'Monthly sales',
    status: ReportDefinitionStatus.Active,
    visibility: ReportDefinitionVisibility.Tenant,
    queryDefinitionId: '662d4f6e7a1c2b00124f0601',
    layout: { type: ReportDefinitionLayoutType.Paged },
    sections: [],
    blocks: [],
    filters: [],
    parameters: [],
    exportOptions: { defaultFormat: 'pdf' },
    tags: [],
    metadata: {},
    settings: {},
    createdAt: '2026-05-02T15:00:00.000Z',
    updatedAt: '2026-05-02T15:00:00.000Z',
    ...overrides,
  };
}
