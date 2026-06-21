import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import {
  ReportDefinitionRecord,
  ReportDefinitionsRepository,
} from '../repositories/report-definitions.repository';
import {
  ReportDefinitionBlockType,
  ReportDefinitionFilterOperator,
  ReportDefinitionLayoutDensity,
  ReportDefinitionLayoutType,
  ReportDefinitionParameterType,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.schema';
import { ReportDefinitionSanitizerService } from '../services/report-definition-sanitizer.service';
import { ReportDefinitionsService } from '../services/report-definitions.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('ReportDefinitionsService', () => {
  it('creates a report definition with sanitized free fields and safe audit', async () => {
    const reportDefinitionId = new Types.ObjectId().toString();
    const tenantId = new Types.ObjectId().toString();
    const queryDefinitionId = new Types.ObjectId().toString();
    const dashboardDefinitionId = new Types.ObjectId().toString();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<ReportDefinitionsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createReportDefinitionRecord({
          id: reportDefinitionId,
          tenantId: record.tenantId,
          reportKey: record.reportKey,
          name: record.name,
          description: record.description,
          status: record.status ?? ReportDefinitionStatus.Draft,
          visibility: record.visibility ?? ReportDefinitionVisibility.Tenant,
          queryDefinitionId: record.queryDefinitionId,
          dashboardDefinitionId: record.dashboardDefinitionId,
          layout: record.layout,
          sections: record.sections,
          blocks: record.blocks,
          filters: record.filters,
          parameters: record.parameters,
          exportOptions: record.exportOptions,
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
        tenantId,
        reportKey: 'monthly_sales_report',
        name: 'Relatorio mensal de vendas',
        description: 'Definicao declarativa para relatorio comercial mensal',
        status: ReportDefinitionStatus.Draft,
        visibility: ReportDefinitionVisibility.Tenant,
        queryDefinitionId,
        dashboardDefinitionId,
        layout: {
          type: ReportDefinitionLayoutType.Paged,
          columns: 12,
          density: ReportDefinitionLayoutDensity.Comfortable,
        },
        sections: [
          {
            key: 'summary',
            title: 'Resumo',
            order: 1,
            layout: { type: ReportDefinitionLayoutType.Sections, columns: 12 },
          },
        ],
        blocks: [
          {
            key: 'sales_table',
            title: 'Tabela de vendas',
            type: ReportDefinitionBlockType.Table,
            queryDefinitionId,
            sectionKey: 'summary',
            order: 1,
            options: { showTotals: true, token: 'must-not-leak' },
          },
        ],
        filters: [
          {
            key: 'period',
            label: 'Periodo',
            field: 'created_at',
            operator: ReportDefinitionFilterOperator.DateRange,
            required: true,
            defaultValue: 'last_30_days',
            allowedValues: ['last_7_days', 'Bearer must-not-leak-token'],
          },
        ],
        parameters: [
          {
            key: 'tenant_period',
            label: 'Periodo do relatorio',
            type: ReportDefinitionParameterType.DateRange,
            required: true,
            defaultValue: 'Basic must-not-leak-token',
            allowedValues: ['last_30_days', true, null],
          },
        ],
        exportOptions: {
          defaultFormat: 'pdf',
          includeFilters: true,
          apiKey: 'must-not-leak',
        },
        tags: ['sales', 'monthly'],
        metadata: { domain: 'sales', token: 'must-not-leak' },
        settings: { visibleInBuilder: true, password: 'must-not-leak' },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        reportKey: 'monthly_sales_report',
        queryDefinitionId,
        dashboardDefinitionId,
        exportOptions: { defaultFormat: 'pdf', includeFilters: true },
        metadata: { domain: 'sales' },
        settings: { visibleInBuilder: true },
        createdBy: 'dev-actor-001',
      }),
    );
    expect(result).toMatchObject({
      id: reportDefinitionId,
      tenantId,
      reportKey: 'monthly_sales_report',
      queryDefinitionId,
      dashboardDefinitionId,
      exportOptions: { defaultFormat: 'pdf', includeFilters: true },
      metadata: { domain: 'sales' },
      settings: { visibleInBuilder: true },
      blocks: [{ options: { showTotals: true } }],
      filters: [{ defaultValue: 'last_30_days', allowedValues: ['last_7_days'] }],
      parameters: [{ defaultValue: undefined, allowedValues: ['last_30_days', true, null] }],
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId,
      actorUserId: undefined,
      action: 'report_definition.created',
      entity: 'report_definition',
      entityId: reportDefinitionId,
      metadata: {
        reportKey: 'monthly_sales_report',
        status: ReportDefinitionStatus.Draft,
        visibility: ReportDefinitionVisibility.Tenant,
        queryDefinitionId,
        dashboardDefinitionId,
        sectionsCount: 1,
        blocksCount: 1,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('lists report definitions by tenant filters', async () => {
    const tenantId = new Types.ObjectId().toString();
    const queryDefinitionId = new Types.ObjectId().toString();
    const reportDefinitionId = new Types.ObjectId().toString();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<ReportDefinitionsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createReportDefinitionRecord({
          id: reportDefinitionId,
          tenantId,
          reportKey: 'monthly_sales_report',
          name: 'Relatorio',
          status: ReportDefinitionStatus.Active,
          visibility: ReportDefinitionVisibility.Tenant,
          queryDefinitionId,
          layout: { type: ReportDefinitionLayoutType.Paged },
          sections: [],
          blocks: [],
          filters: [],
          parameters: [],
          exportOptions: {},
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
      tenantId,
      queryDefinitionId,
      status: ReportDefinitionStatus.Active,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        reportKey: undefined,
        status: ReportDefinitionStatus.Active,
        visibility: undefined,
        queryDefinitionId,
        dashboardDefinitionId: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.reportKey).toBe('monthly_sales_report');
  });

  it('gets one report definition using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId().toString();
    const reportDefinitionId = new Types.ObjectId().toString();
    const repository: Pick<ReportDefinitionsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(service.findOne(tenantId, reportDefinitionId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(tenantId, reportDefinitionId);
  });

  it('updates a report definition with sanitized settings and audit', async () => {
    const tenantId = new Types.ObjectId().toString();
    const reportDefinitionId = new Types.ObjectId().toString();
    const updatedAt = new Date('2026-04-26T13:00:00.000Z');
    const repository: Pick<ReportDefinitionsRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        createReportDefinitionRecord({
          id: reportDefinitionId,
          tenantId,
          reportKey: record.reportKey ?? 'monthly_sales_report',
          name: record.name ?? 'Relatorio',
          status: record.status ?? ReportDefinitionStatus.Active,
          visibility: record.visibility ?? ReportDefinitionVisibility.Tenant,
          layout: record.layout ?? { type: ReportDefinitionLayoutType.Paged },
          sections: record.sections ?? [],
          blocks: record.blocks ?? [],
          filters: record.filters ?? [],
          parameters: record.parameters ?? [],
          exportOptions: record.exportOptions ?? {},
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
      tenantId,
      reportDefinitionId,
      {
        name: 'Relatorio atualizado',
        exportOptions: { defaultFormat: 'xlsx', token: 'must-not-leak' },
        settings: { visibleInBuilder: false, password: 'must-not-leak' },
      },
      { actorId: 'dev-actor-002' },
    );

    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      reportDefinitionId,
      expect.objectContaining({
        name: 'Relatorio atualizado',
        exportOptions: { defaultFormat: 'xlsx' },
        settings: { visibleInBuilder: false },
        updatedBy: 'dev-actor-002',
      }),
    );
    expect(result.exportOptions).toEqual({ defaultFormat: 'xlsx' });
    expect(result.settings).toEqual({ visibleInBuilder: false });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'report_definition.updated' }),
    );
  });

  it('archives a report definition using soft delete', async () => {
    const tenantId = new Types.ObjectId().toString();
    const reportDefinitionId = new Types.ObjectId().toString();
    const updatedAt = new Date('2026-04-26T13:30:00.000Z');
    const repository: Pick<ReportDefinitionsRepository, 'archiveByTenantAndId'> = {
      archiveByTenantAndId: jest.fn(async () =>
        createReportDefinitionRecord({
          id: reportDefinitionId,
          tenantId,
          reportKey: 'monthly_sales_report',
          name: 'Relatorio',
          status: ReportDefinitionStatus.Archived,
          visibility: ReportDefinitionVisibility.Tenant,
          layout: { type: ReportDefinitionLayoutType.Paged },
          sections: [],
          blocks: [],
          filters: [],
          parameters: [],
          exportOptions: {},
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

    const result = await service.archive(tenantId, reportDefinitionId, {
      actorId: 'dev-actor-003',
    });

    expect(repository.archiveByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      reportDefinitionId,
      'dev-actor-003',
    );
    expect(result.status).toBe(ReportDefinitionStatus.Archived);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'report_definition.archived' }),
    );
  });

  it('returns conflict when reportKey is duplicated for tenant', async () => {
    const repository: Pick<ReportDefinitionsRepository, 'create'> = {
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
        reportKey: 'monthly_sales_report',
        name: 'Relatorio',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createService(
  repository: Partial<ReportDefinitionsRepository>,
  auditService: AuditServiceMock = createAuditService(),
): ReportDefinitionsService {
  return new ReportDefinitionsService(
    repository as ReportDefinitionsRepository,
    new ReportDefinitionSanitizerService(),
    auditService as unknown as AuditService,
  );
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: new Types.ObjectId().toString(),
      tenantId: new Types.ObjectId().toString(),
      action: 'report_definition.created',
      entity: 'report_definition',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createReportDefinitionRecord(
  record: Partial<ReportDefinitionRecord>,
): ReportDefinitionRecord {
  return record as ReportDefinitionRecord;
}
