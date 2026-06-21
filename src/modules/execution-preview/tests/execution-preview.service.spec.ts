import { NotFoundException } from '@nestjs/common';

import { AuditService } from '../../audit/services/audit.service';
import {
  DashboardDefinitionResponseDto,
  DashboardDefinitionWidgetResponseDto,
} from '../../dashboard-definitions/dto/dashboard-definition-response.dto';
import {
  DashboardDefinitionChartType,
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../../dashboard-definitions/schemas/dashboard-definition.constants';
import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import { QueryDefinitionResponseDto } from '../../query-definitions/dto/query-definition-response.dto';
import {
  QueryDefinitionAggregation,
  QueryDefinitionFilterOperator,
  QueryDefinitionStatus,
  QueryDefinitionType,
} from '../../query-definitions/schemas/query-definition.constants';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import {
  DashboardPreviewWidgetStatus,
  DashboardPreviewWidgetStatusReason,
} from '../dto/dashboard-preview-response.dto';
import { ExecutionPreviewMode } from '../dto/query-preview-response.dto';
import { DemoDashboardPreviewGeneratorService } from '../services/demo-dashboard-preview-generator.service';
import { DemoQueryPreviewGeneratorService } from '../services/demo-query-preview-generator.service';
import { ExecutionPreviewService } from '../services/execution-preview.service';

type QueryDefinitionsServiceMock = {
  findOne: jest.Mock;
};

type DashboardDefinitionsServiceMock = {
  findOne: jest.Mock;
};

type AuditServiceMock = {
  record: jest.Mock;
};

const tenantId = '662d4f6e7a1c2b00124f0001';
const queryDefinitionId = '662d4f6e7a1c2b00124f0601';
const dashboardDefinitionId = '662d4f6e7a1c2b00124f0701';

describe('ExecutionPreviewService', () => {
  it('generates query preview using tenant-scoped query definition lookup', async () => {
    const queryDefinitionsService = createQueryDefinitionsService();
    const dashboardDefinitionsService = createDashboardDefinitionsService();
    const auditService = createAuditService();
    const service = createService(
      queryDefinitionsService,
      dashboardDefinitionsService,
      auditService,
    );

    const result = await service.previewQuery(
      tenantId,
      queryDefinitionId,
      { rowLimit: 3 },
      { actorId: '662d4f6e7a1c2b00124f0999' },
    );

    expect(queryDefinitionsService.findOne).toHaveBeenCalledWith(tenantId, queryDefinitionId);
    expect(result).toMatchObject({
      mode: ExecutionPreviewMode.Demo,
      queryDefinitionId,
      queryKey: 'sales_overview_demo',
      meta: {
        rowCount: 3,
        isPreview: true,
        source: 'demo-generator',
      },
    });
    expect(result.columns.map((column) => column.key)).toEqual(['period', 'total_sales']);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.period).toContain('demo');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId,
      actorUserId: '662d4f6e7a1c2b00124f0999',
      action: 'execution_preview.query.generated',
      entity: 'query_definition',
      entityId: queryDefinitionId,
      metadata: {
        tenantId,
        queryDefinitionId,
        queryKey: 'sales_overview_demo',
        mode: ExecutionPreviewMode.Demo,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('rows');
  });

  it('propagates standardized not-found flow and does not audit missing query previews', async () => {
    const queryDefinitionsService = createQueryDefinitionsService({
      findOne: jest.fn(async () => {
        throw new NotFoundException('Query definition not found.');
      }),
    });
    const dashboardDefinitionsService = createDashboardDefinitionsService();
    const auditService = createAuditService();
    const service = createService(
      queryDefinitionsService,
      dashboardDefinitionsService,
      auditService,
    );

    await expect(service.previewQuery(tenantId, queryDefinitionId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(queryDefinitionsService.findOne).toHaveBeenCalledWith(tenantId, queryDefinitionId);
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('generates dashboard preview with ready widgets backed by query definitions', async () => {
    const queryDefinitionsService = createQueryDefinitionsService();
    const dashboardDefinitionsService = createDashboardDefinitionsService();
    const auditService = createAuditService();
    const service = createService(
      queryDefinitionsService,
      dashboardDefinitionsService,
      auditService,
    );

    const result = await service.previewDashboard(tenantId, dashboardDefinitionId, {
      rowLimitPerWidget: 2,
    });

    expect(dashboardDefinitionsService.findOne).toHaveBeenCalledWith(
      tenantId,
      dashboardDefinitionId,
    );
    expect(queryDefinitionsService.findOne).toHaveBeenCalledWith(tenantId, queryDefinitionId);
    expect(result).toMatchObject({
      mode: ExecutionPreviewMode.Demo,
      dashboardDefinitionId,
      dashboardKey: 'commercial_dashboard_demo',
      meta: {
        isPreview: true,
        source: 'demo-generator',
        widgetsCount: 1,
        readyWidgetsCount: 1,
      },
    });
    expect(result.widgets[0]).toMatchObject({
      widgetKey: 'total_sales',
      status: DashboardPreviewWidgetStatus.Ready,
      queryDefinitionId,
    });
    expect(result.widgets[0]?.data.rows).toHaveLength(2);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'execution_preview.dashboard.generated',
        metadata: {
          tenantId,
          dashboardDefinitionId,
          dashboardKey: 'commercial_dashboard_demo',
          mode: ExecutionPreviewMode.Demo,
          widgetsCount: 1,
          readyWidgetsCount: 1,
        },
      }),
    );
  });

  it('degrades dashboard widgets without queryDefinitionId without breaking the response', async () => {
    const queryDefinitionsService = createQueryDefinitionsService();
    const dashboardDefinitionsService = createDashboardDefinitionsService({
      findOne: jest.fn(async () =>
        createDashboardDefinitionResponse({
          widgets: [createWidgetResponse({ queryDefinitionId: undefined })],
        }),
      ),
    });
    const service = createService(queryDefinitionsService, dashboardDefinitionsService);

    const result = await service.previewDashboard(tenantId, dashboardDefinitionId);

    expect(queryDefinitionsService.findOne).not.toHaveBeenCalled();
    expect(result.meta).toMatchObject({ widgetsCount: 1, readyWidgetsCount: 0 });
    expect(result.widgets[0]).toMatchObject({
      status: DashboardPreviewWidgetStatus.Degraded,
      reason: DashboardPreviewWidgetStatusReason.MissingQueryDefinition,
      data: { columns: [], rows: [] },
    });
  });

  it('degrades dashboard widgets when referenced query definition is not found', async () => {
    const queryDefinitionsService = createQueryDefinitionsService({
      findOne: jest.fn(async () => {
        throw new NotFoundException('Query definition not found.');
      }),
    });
    const dashboardDefinitionsService = createDashboardDefinitionsService();
    const service = createService(queryDefinitionsService, dashboardDefinitionsService);

    const result = await service.previewDashboard(tenantId, dashboardDefinitionId);

    expect(result.meta).toMatchObject({ widgetsCount: 1, readyWidgetsCount: 0 });
    expect(result.widgets[0]).toMatchObject({
      status: DashboardPreviewWidgetStatus.Degraded,
      reason: DashboardPreviewWidgetStatusReason.QueryDefinitionNotFound,
    });
  });

  it('does not use metadata settings filter defaults or allowed values in preview data or audit', async () => {
    const queryDefinitionsService = createQueryDefinitionsService({
      findOne: jest.fn(async () =>
        createQueryDefinitionResponse({
          metadata: { domain: 'sales', token: 'must-not-leak' },
          settings: { visibleInBuilder: true, authorization: 'Bearer must-not-leak' },
          filters: [
            {
              key: 'period',
              label: 'Periodo',
              field: 'created_at',
              operator: QueryDefinitionFilterOperator.DateRange,
              required: true,
              defaultValue: 'must-not-leak-default',
              allowedValues: ['must-not-leak-allowed'],
            },
          ],
        }),
      ),
    });
    const dashboardDefinitionsService = createDashboardDefinitionsService();
    const auditService = createAuditService();
    const service = createService(
      queryDefinitionsService,
      dashboardDefinitionsService,
      auditService,
    );

    const result = await service.previewQuery(tenantId, queryDefinitionId);
    const serializedResult = JSON.stringify(result);
    const serializedAudit = JSON.stringify(auditService.record.mock.calls);

    expect(serializedResult).not.toContain('must-not-leak');
    expect(serializedAudit).not.toContain('must-not-leak');
    expect(serializedAudit).not.toContain('defaultValue');
    expect(serializedAudit).not.toContain('allowedValues');
  });
});

function createService(
  queryDefinitionsService: QueryDefinitionsServiceMock = createQueryDefinitionsService(),
  dashboardDefinitionsService: DashboardDefinitionsServiceMock = createDashboardDefinitionsService(),
  auditService: AuditServiceMock = createAuditService(),
): ExecutionPreviewService {
  const queryPreviewGenerator = new DemoQueryPreviewGeneratorService();

  return new ExecutionPreviewService(
    queryDefinitionsService as unknown as QueryDefinitionsService,
    dashboardDefinitionsService as unknown as DashboardDefinitionsService,
    queryPreviewGenerator,
    new DemoDashboardPreviewGeneratorService(queryPreviewGenerator),
    auditService as unknown as AuditService,
  );
}

function createQueryDefinitionsService(
  overrides: Partial<QueryDefinitionsServiceMock> = {},
): QueryDefinitionsServiceMock {
  return {
    findOne: jest.fn(async () => createQueryDefinitionResponse()),
    ...overrides,
  };
}

function createDashboardDefinitionsService(
  overrides: Partial<DashboardDefinitionsServiceMock> = {},
): DashboardDefinitionsServiceMock {
  return {
    findOne: jest.fn(async () => createDashboardDefinitionResponse()),
    ...overrides,
  };
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: '662d4f6e7a1c2b00124f0888',
      tenantId,
      action: 'execution_preview.query.generated',
      entity: 'query_definition',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createQueryDefinitionResponse(
  overrides: Partial<QueryDefinitionResponseDto> = {},
): QueryDefinitionResponseDto {
  return {
    id: queryDefinitionId,
    tenantId,
    datasetId: '662d4f6e7a1c2b00124f0501',
    queryKey: 'sales_overview_demo',
    name: 'Visao geral demo',
    status: QueryDefinitionStatus.Active,
    type: QueryDefinitionType.Timeseries,
    metrics: [
      {
        key: 'total_sales',
        label: 'Vendas totais',
        field: 'total_amount',
        aggregation: QueryDefinitionAggregation.Sum,
        format: 'currency',
      },
    ],
    dimensions: [],
    filters: [
      {
        key: 'period',
        label: 'Periodo',
        field: 'created_at',
        operator: QueryDefinitionFilterOperator.DateRange,
        required: true,
        allowedValues: [],
      },
    ],
    sorts: [],
    defaultLimit: 6,
    timeField: 'created_at',
    allowedGranularities: [],
    tags: ['sales', 'demo'],
    metadata: {},
    settings: {},
    createdAt: '2026-04-26T12:00:00.000Z',
    updatedAt: '2026-04-26T12:00:00.000Z',
    ...overrides,
  };
}

function createDashboardDefinitionResponse(
  overrides: Partial<DashboardDefinitionResponseDto> = {},
): DashboardDefinitionResponseDto {
  return {
    id: dashboardDefinitionId,
    tenantId,
    dashboardKey: 'commercial_dashboard_demo',
    name: 'Dashboard comercial demo',
    status: DashboardDefinitionStatus.Active,
    visibility: DashboardDefinitionVisibility.Tenant,
    layout: { type: DashboardDefinitionLayoutType.Grid, columns: 12 },
    sections: [],
    widgets: [createWidgetResponse()],
    filters: [],
    tags: ['sales', 'demo'],
    metadata: {},
    settings: {},
    createdAt: '2026-04-26T12:00:00.000Z',
    updatedAt: '2026-04-26T12:00:00.000Z',
    ...overrides,
  };
}

function createWidgetResponse(
  overrides: Partial<DashboardDefinitionWidgetResponseDto> = {},
): DashboardDefinitionWidgetResponseDto {
  return {
    key: 'total_sales',
    title: 'Vendas totais',
    type: DashboardDefinitionWidgetType.MetricCard,
    queryDefinitionId,
    order: 1,
    visualization: {
      chartType: DashboardDefinitionChartType.Number,
      yFields: ['total_sales'],
      format: 'currency',
    },
    options: {},
    ...overrides,
  };
}
