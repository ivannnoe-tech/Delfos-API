/**
 * Size note: this spec is above the 500-line guideline (see CLAUDE.md /
 * AGENTS.md). It is kept as one file on purpose — a single cohesive suite for
 * the execution-request dry-run service, sharing fakes and fixtures.
 * Splitting is deferred to a dedicated, test-driven refactor.
 */
import { NotFoundException } from '@nestjs/common';

import {
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../../dashboard-definitions/schemas/dashboard-definition.schema';
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
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import {
  ReportDefinitionLayoutType,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../../report-definitions/schemas/report-definition.schema';
import { ReportDefinitionsService } from '../../report-definitions/services/report-definitions.service';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';
import { ExecutionRequestAuditService } from '../services/execution-request-audit.service';
import { ExecutionRequestDryRunService } from '../services/execution-request-dry-run.service';
import { ExecutionRequestReadinessService } from '../services/execution-request-readiness.service';
import {
  createActorFixture,
  createRuntimeEventFixture,
  createRuntimeRequestFixture,
  newId,
} from './execution-request-test-fixtures';

type DeclarativeServicesMock = {
  queryDefinitionsService: Pick<QueryDefinitionsService, 'findOne'>;
  dashboardDefinitionsService: Pick<DashboardDefinitionsService, 'findOne'>;
  reportDefinitionsService: Pick<ReportDefinitionsService, 'findOne'>;
  datasetsService: Pick<DatasetsService, 'findOne'>;
  fieldMappingsService: Pick<FieldMappingsService, 'findByFilters'>;
};

describe('ExecutionRequestDryRunService', () => {
  it('runs a ready query dry-run without exposing secrets or starting runtime execution', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse(),
      dataset: createDatasetResponse(),
      fieldMappings: [createFieldMappingResponse()],
    });

    const result = await harness.service.dryRun(
      harness.executionRequestId,
      { tenantId: harness.tenantId },
      createActorFixture(),
    );

    expect(result).toMatchObject({
      executionRequestId: harness.executionRequestId,
      requestKey: `exec_req_${harness.executionRequestId}`,
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
      harness.tenantId,
      harness.queryDefinitionId,
    );
    expect(harness.datasetsService.findOne).toHaveBeenCalledWith(
      harness.tenantId,
      harness.datasetId,
    );
    expect(harness.fieldMappingsService.findByFilters).toHaveBeenCalledWith({
      tenantId: harness.tenantId,
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
    expect(harness.auditService.recordDryRun).toHaveBeenCalledWith(
      expect.objectContaining({ requestKey: `exec_req_${harness.executionRequestId}` }),
      createActorFixture(),
      {
        ready: true,
        blockersCount: 0,
        warningsCount: 0,
        nextStatus: ExecutionRequestStatus.Accepted,
      },
    );
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });

  it('blocks query dry-run when queryDefinitionId is missing and creates a timeline event', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      missingQueryDefinitionId: true,
    });

    const result = await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
    });

    expect(result.ready).toBe(false);
    expect(result.recommendedStatus).toBe(ExecutionRequestStatus.Blocked);
    expect(result.blockers).toContainEqual(
      expect.objectContaining({ code: 'query_definition_id_missing' }),
    );
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
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

    const result = await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContainEqual(
      expect.objectContaining({ code: 'query_definition_not_found' }),
    );
    expect(harness.queryDefinitionsService.findOne).toHaveBeenCalledWith(
      harness.tenantId,
      harness.queryDefinitionId,
    );
  });

  it('blocks query dry-run when the query has no dataset reference', async () => {
    const harness = createDryRunHarness({
      kind: ExecutionRequestKind.Query,
      queryDefinition: createQueryDefinitionResponse({
        datasetId: undefined as unknown as string,
      }),
    });

    const result = await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
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
      missingDataset.executionRequestId,
      { tenantId: missingDataset.tenantId },
    );
    const datasetWithoutMappingsResult = await datasetWithoutMappings.service.dryRun(
      datasetWithoutMappings.executionRequestId,
      { tenantId: datasetWithoutMappings.tenantId },
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

    const result = await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
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

    const result = await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
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

    const noWidgetsResult = await noWidgets.service.dryRun(noWidgets.executionRequestId, {
      tenantId: noWidgets.tenantId,
    });
    const noWidgetQueriesResult = await noWidgetQueries.service.dryRun(
      noWidgetQueries.executionRequestId,
      { tenantId: noWidgetQueries.tenantId },
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
        dashboardDefinitionId: withQuery.dashboardDefinitionId,
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

    const withQueryResult = await withQuery.service.dryRun(withQuery.executionRequestId, {
      tenantId: withQuery.tenantId,
    });
    const withDashboardResult = await withDashboard.service.dryRun(
      withDashboard.executionRequestId,
      { tenantId: withDashboard.tenantId },
    );
    const withoutReferenceResult = await withoutReference.service.dryRun(
      withoutReference.executionRequestId,
      { tenantId: withoutReference.tenantId },
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

    await harness.service.dryRun(harness.executionRequestId, {
      tenantId: harness.tenantId,
    });

    expect(harness.executionRequestsRepository.findByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
    );
    expect(harness.executionRequestsRepository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      harness.tenantId,
      harness.executionRequestId,
      ExecutionRequestStatus.Blocked,
    );
  });
});

interface DryRunHarnessOptions {
  kind: ExecutionRequestKind;
  status?: ExecutionRequestStatus;
  missingQueryDefinitionId?: boolean;
  queryDefinition?: Awaited<ReturnType<QueryDefinitionsService['findOne']>>;
  dashboardDefinition?: Awaited<ReturnType<DashboardDefinitionsService['findOne']>>;
  reportDefinition?: Awaited<ReturnType<ReportDefinitionsService['findOne']>>;
  dataset?: Awaited<ReturnType<DatasetsService['findOne']>>;
  fieldMappings?: Awaited<ReturnType<FieldMappingsService['findByFilters']>>['items'];
}

function createDryRunHarness(options: DryRunHarnessOptions) {
  const tenantId = newId();
  const executionRequestId = newId();
  const queryDefinitionId = newId();
  const dashboardDefinitionId = newId();
  const reportDefinitionId = newId();
  const datasetId = '662d4f6e7a1c2b00124f0501';
  const executionRequest = createRuntimeRequestFixture({
    id: executionRequestId,
    tenantId,
    kind: options.kind,
    status: options.status ?? ExecutionRequestStatus.Accepted,
    queryDefinitionId: options.missingQueryDefinitionId ? undefined : queryDefinitionId,
    dashboardDefinitionId,
    reportDefinitionId,
  });
  const executionRequestsRepository: Pick<
    ExecutionRequestsRepository,
    'findByTenantAndId' | 'updateStatusByTenantAndId'
  > = {
    findByTenantAndId: jest.fn(async () => executionRequest),
    updateStatusByTenantAndId: jest.fn(async (_tenantId, _id, status) =>
      createRuntimeRequestFixture({ ...executionRequest, status }),
    ),
  };
  const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
    create: jest.fn(async (record) => createRuntimeEventFixture(record)),
  };
  const declarativeServices = createDeclarativeServices(options, {
    queryDefinitionId,
    dashboardDefinitionId,
    reportDefinitionId,
    datasetId,
  });
  const auditService = createAuditServiceMock();
  const readinessService = new ExecutionRequestReadinessService(
    declarativeServices.queryDefinitionsService as QueryDefinitionsService,
    declarativeServices.dashboardDefinitionsService as DashboardDefinitionsService,
    declarativeServices.reportDefinitionsService as ReportDefinitionsService,
    declarativeServices.datasetsService as DatasetsService,
    declarativeServices.fieldMappingsService as FieldMappingsService,
  );
  const service = new ExecutionRequestDryRunService(
    executionRequestsRepository as ExecutionRequestsRepository,
    eventRepository as ExecutionRequestEventsRepository,
    auditService as ExecutionRequestAuditService,
    readinessService,
  );

  return {
    service,
    tenantId,
    executionRequestId,
    queryDefinitionId,
    dashboardDefinitionId,
    datasetId,
    executionRequestsRepository,
    eventRepository,
    auditService,
    ...declarativeServices,
  };
}

function createDeclarativeServices(
  options: DryRunHarnessOptions,
  ids: {
    queryDefinitionId: string;
    dashboardDefinitionId: string;
    reportDefinitionId: string;
    datasetId: string;
  },
): DeclarativeServicesMock {
  const queryDefinition = options.queryDefinition
    ? {
        ...options.queryDefinition,
        id: ids.queryDefinitionId,
        datasetId: Object.prototype.hasOwnProperty.call(options.queryDefinition, 'datasetId')
          ? options.queryDefinition.datasetId
          : ids.datasetId,
      }
    : undefined;
  const dashboardDefinition = options.dashboardDefinition
    ? { ...options.dashboardDefinition, id: ids.dashboardDefinitionId }
    : undefined;
  const reportDefinition = options.reportDefinition
    ? { ...options.reportDefinition, id: ids.reportDefinitionId }
    : undefined;
  const dataset = options.dataset ? { ...options.dataset, id: ids.datasetId } : undefined;

  return {
    queryDefinitionsService: {
      findOne: jest.fn(async () => {
        if (!queryDefinition) {
          throw new NotFoundException('Query definition not found.');
        }

        return queryDefinition;
      }),
    },
    dashboardDefinitionsService: {
      findOne: jest.fn(async () => {
        if (!dashboardDefinition) {
          throw new NotFoundException('Dashboard definition not found.');
        }

        return dashboardDefinition;
      }),
    },
    reportDefinitionsService: {
      findOne: jest.fn(async () => {
        if (!reportDefinition) {
          throw new NotFoundException('Report definition not found.');
        }

        return reportDefinition;
      }),
    },
    datasetsService: {
      findOne: jest.fn(async () => {
        if (!dataset) {
          throw new NotFoundException('Dataset not found.');
        }

        return dataset;
      }),
    },
    fieldMappingsService: {
      findByFilters: jest.fn(async () => ({
        items: options.fieldMappings ?? [],
        meta: {
          page: 1,
          pageSize: 1000,
          total: options.fieldMappings?.length ?? 0,
          totalPages: options.fieldMappings && options.fieldMappings.length > 0 ? 1 : 0,
        },
      })),
    },
  };
}

function createAuditServiceMock(): Pick<
  ExecutionRequestAuditService,
  'recordEvent' | 'recordDryRun' | 'recordExecutionRequest'
> {
  return {
    recordEvent: jest.fn(async () => undefined),
    recordDryRun: jest.fn(async () => undefined),
    recordExecutionRequest: jest.fn(async () => undefined),
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
