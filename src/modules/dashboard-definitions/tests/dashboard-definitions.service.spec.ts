import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { DashboardDefinitionsRepository } from '../repositories/dashboard-definitions.repository';
import {
  DashboardDefinitionChartType,
  DashboardDefinitionDocument,
  DashboardDefinitionFilterOperator,
  DashboardDefinitionLayoutDensity,
  DashboardDefinitionLayoutGap,
  DashboardDefinitionLayoutType,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
  DashboardDefinitionWidgetType,
} from '../schemas/dashboard-definition.schema';
import { DashboardDefinitionSanitizerService } from '../services/dashboard-definition-sanitizer.service';
import { DashboardDefinitionsService } from '../services/dashboard-definitions.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('DashboardDefinitionsService', () => {
  it('creates a dashboard definition with sanitized free fields and safe audit', async () => {
    const dashboardDefinitionId = new Types.ObjectId();
    const tenantId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<DashboardDefinitionsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createDashboardDefinitionDocument({
          _id: dashboardDefinitionId,
          tenantId: record.tenantId,
          dashboardKey: record.dashboardKey,
          name: record.name,
          description: record.description,
          status: record.status ?? DashboardDefinitionStatus.Draft,
          visibility: record.visibility ?? DashboardDefinitionVisibility.Tenant,
          layout: record.layout,
          sections: record.sections,
          widgets: record.widgets,
          filters: record.filters,
          tags: record.tags,
          metadata: record.metadata,
          settings: record.settings,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, auditService);

    const result = await service.create(
      {
        tenantId: tenantId.toString(),
        dashboardKey: 'sales_dashboard',
        name: 'Dashboard de vendas',
        description: 'Painel logico para acompanhamento comercial',
        status: DashboardDefinitionStatus.Draft,
        visibility: DashboardDefinitionVisibility.Tenant,
        layout: {
          type: DashboardDefinitionLayoutType.Grid,
          columns: 12,
          gap: DashboardDefinitionLayoutGap.Md,
          density: DashboardDefinitionLayoutDensity.Comfortable,
        },
        sections: [
          {
            key: 'overview',
            title: 'Visao geral',
            description: 'Indicadores principais',
            order: 1,
            layout: { type: DashboardDefinitionLayoutType.Grid, columns: 12 },
          },
        ],
        widgets: [
          {
            key: 'total_sales',
            title: 'Vendas totais',
            description: 'Soma das vendas do periodo',
            type: DashboardDefinitionWidgetType.MetricCard,
            queryDefinitionId: queryDefinitionId.toString(),
            sectionKey: 'overview',
            order: 1,
            size: { cols: 3, rows: 1 },
            position: { x: 0, y: 0 },
            visualization: {
              chartType: DashboardDefinitionChartType.Number,
              format: 'currency',
            },
            options: { showTrend: true, token: 'must-not-leak' },
          },
        ],
        filters: [
          {
            key: 'period',
            label: 'Periodo',
            field: 'created_at',
            operator: DashboardDefinitionFilterOperator.DateRange,
            required: true,
            defaultValue: 'last_30_days',
            allowedValues: ['last_7_days', 'Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3Nn4'],
          },
        ],
        tags: ['sales', 'overview'],
        metadata: { domain: 'sales', token: 'must-not-leak' },
        settings: { visibleInBuilder: true, authorization: 'Bearer must-not-leak' },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        dashboardKey: 'sales_dashboard',
        metadata: { domain: 'sales' },
        settings: { visibleInBuilder: true },
        createdBy: 'dev-actor-001',
      }),
    );
    expect(result).toMatchObject({
      id: dashboardDefinitionId.toString(),
      tenantId: tenantId.toString(),
      dashboardKey: 'sales_dashboard',
      metadata: { domain: 'sales' },
      settings: { visibleInBuilder: true },
      widgets: [{ options: { showTrend: true } }],
      filters: [{ defaultValue: 'last_30_days', allowedValues: ['last_7_days'] }],
    });
    expect(result.widgets[0]?.queryDefinitionId).toBe(queryDefinitionId.toString());
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: tenantId.toString(),
      actorUserId: undefined,
      action: 'dashboard_definition.created',
      entity: 'dashboard_definition',
      entityId: dashboardDefinitionId.toString(),
      metadata: {
        dashboardKey: 'sales_dashboard',
        status: DashboardDefinitionStatus.Draft,
        visibility: DashboardDefinitionVisibility.Tenant,
        sectionsCount: 1,
        widgetsCount: 1,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('lists dashboard definitions by tenant filters', async () => {
    const tenantId = new Types.ObjectId();
    const dashboardDefinitionId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<DashboardDefinitionsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createDashboardDefinitionDocument({
          _id: dashboardDefinitionId,
          tenantId,
          dashboardKey: 'sales_dashboard',
          name: 'Dashboard de vendas',
          status: DashboardDefinitionStatus.Active,
          visibility: DashboardDefinitionVisibility.Tenant,
          layout: { type: DashboardDefinitionLayoutType.Grid },
          sections: [],
          widgets: [],
          filters: [],
          tags: [],
          metadata: {},
          settings: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository);

    const result = await service.findByFilters({
      tenantId: tenantId.toString(),
      status: DashboardDefinitionStatus.Active,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        dashboardKey: undefined,
        status: DashboardDefinitionStatus.Active,
        visibility: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.dashboardKey).toBe('sales_dashboard');
  });

  it('gets one dashboard definition using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const dashboardDefinitionId = new Types.ObjectId();
    const repository: Pick<DashboardDefinitionsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(
      service.findOne(tenantId.toString(), dashboardDefinitionId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      dashboardDefinitionId.toString(),
    );
  });

  it('updates a dashboard definition with sanitized settings and audit', async () => {
    const tenantId = new Types.ObjectId();
    const dashboardDefinitionId = new Types.ObjectId();
    const updatedAt = new Date('2026-04-26T13:00:00.000Z');
    const repository: Pick<DashboardDefinitionsRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        createDashboardDefinitionDocument({
          _id: dashboardDefinitionId,
          tenantId,
          dashboardKey: record.dashboardKey ?? 'sales_dashboard',
          name: record.name ?? 'Dashboard',
          status: record.status ?? DashboardDefinitionStatus.Active,
          visibility: record.visibility ?? DashboardDefinitionVisibility.Tenant,
          layout: record.layout ?? { type: DashboardDefinitionLayoutType.Grid },
          sections: record.sections ?? [],
          widgets: record.widgets ?? [],
          filters: record.filters ?? [],
          tags: record.tags ?? [],
          metadata: record.metadata ?? {},
          settings: record.settings ?? {},
          updatedBy: record.updatedBy,
          createdAt: updatedAt,
          updatedAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, auditService);

    const result = await service.update(
      tenantId.toString(),
      dashboardDefinitionId.toString(),
      {
        name: 'Dashboard atualizado',
        settings: { visibleInBuilder: false, password: 'must-not-leak' },
      },
      { actorId: 'dev-actor-002' },
    );

    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      dashboardDefinitionId.toString(),
      expect.objectContaining({
        name: 'Dashboard atualizado',
        settings: { visibleInBuilder: false },
        updatedBy: 'dev-actor-002',
      }),
    );
    expect(result.settings).toEqual({ visibleInBuilder: false });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dashboard_definition.updated' }),
    );
  });

  it('archives a dashboard definition using soft delete', async () => {
    const tenantId = new Types.ObjectId();
    const dashboardDefinitionId = new Types.ObjectId();
    const updatedAt = new Date('2026-04-26T13:30:00.000Z');
    const repository: Pick<DashboardDefinitionsRepository, 'archiveByTenantAndId'> = {
      archiveByTenantAndId: jest.fn(async () =>
        createDashboardDefinitionDocument({
          _id: dashboardDefinitionId,
          tenantId,
          dashboardKey: 'sales_dashboard',
          name: 'Dashboard',
          status: DashboardDefinitionStatus.Archived,
          visibility: DashboardDefinitionVisibility.Tenant,
          layout: { type: DashboardDefinitionLayoutType.Grid },
          sections: [],
          widgets: [],
          filters: [],
          tags: [],
          metadata: {},
          settings: {},
          createdAt: updatedAt,
          updatedAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, auditService);

    const result = await service.archive(tenantId.toString(), dashboardDefinitionId.toString(), {
      actorId: 'dev-actor-003',
    });

    expect(repository.archiveByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      dashboardDefinitionId.toString(),
      'dev-actor-003',
    );
    expect(result.status).toBe(DashboardDefinitionStatus.Archived);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dashboard_definition.archived' }),
    );
  });

  it('returns conflict when dashboardKey is duplicated for tenant', async () => {
    const repository: Pick<DashboardDefinitionsRepository, 'create'> = {
      create: jest.fn(async () => {
        const error = new Error('duplicate key') as Error & { code: number };
        error.code = 11000;
        throw error;
      }),
    };
    const service = createService(repository);

    await expect(
      service.create({
        tenantId: new Types.ObjectId().toString(),
        dashboardKey: 'sales_dashboard',
        name: 'Dashboard',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createService(
  repository: Partial<DashboardDefinitionsRepository>,
  auditService: AuditServiceMock = createAuditService(),
): DashboardDefinitionsService {
  return new DashboardDefinitionsService(
    repository as DashboardDefinitionsRepository,
    new DashboardDefinitionSanitizerService(),
    auditService as unknown as AuditService,
  );
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: new Types.ObjectId().toString(),
      tenantId: new Types.ObjectId().toString(),
      action: 'dashboard_definition.created',
      entity: 'dashboard_definition',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createDashboardDefinitionDocument(
  record: Partial<DashboardDefinitionDocument>,
): DashboardDefinitionDocument {
  return record as DashboardDefinitionDocument;
}
