import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { QueryDefinitionsRepository } from '../repositories/query-definitions.repository';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionDocument,
  QueryDefinitionFilterOperator,
  QueryDefinitionSortDirection,
  QueryDefinitionStatus,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../schemas/query-definition.schema';
import { QueryDefinitionSanitizerService } from '../services/query-definition-sanitizer.service';
import { QueryDefinitionsService } from '../services/query-definitions.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('QueryDefinitionsService', () => {
  it('creates a query definition with sanitized free values and safe audit', async () => {
    const queryDefinitionId = new Types.ObjectId();
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<QueryDefinitionsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createQueryDefinitionDocument({
          _id: queryDefinitionId,
          tenantId: record.tenantId,
          datasetId: record.datasetId,
          queryKey: record.queryKey,
          name: record.name,
          description: record.description,
          status: record.status ?? QueryDefinitionStatus.Draft,
          type: record.type ?? QueryDefinitionType.Table,
          metrics: record.metrics,
          dimensions: record.dimensions,
          filters: record.filters,
          sorts: record.sorts,
          defaultLimit: record.defaultLimit,
          timeField: record.timeField,
          allowedGranularities: record.allowedGranularities,
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
        datasetId: datasetId.toString(),
        queryKey: 'sales_overview',
        name: 'Visao geral de vendas',
        description: 'Definicao logica para indicadores de vendas',
        type: QueryDefinitionType.Metric,
        status: QueryDefinitionStatus.Draft,
        metrics: [
          {
            key: 'total_sales',
            label: 'Vendas totais',
            field: 'total_amount',
            aggregation: QueryDefinitionAggregation.Sum,
            format: 'currency',
            description: 'Soma do valor total de vendas',
          },
        ],
        dimensions: [
          {
            key: 'seller',
            label: 'Vendedor',
            field: 'seller_name',
            type: QueryDefinitionDimensionType.String,
          },
        ],
        filters: [
          {
            key: 'period',
            label: 'Periodo',
            field: 'created_at',
            operator: QueryDefinitionFilterOperator.DateRange,
            required: true,
            defaultValue: 'Bearer must-not-leak-token',
            allowedValues: ['day', 'Basic must-not-leak-token', true, null],
          },
        ],
        sorts: [
          {
            field: 'total_amount',
            direction: QueryDefinitionSortDirection.Desc,
          },
        ],
        defaultLimit: 100,
        timeField: 'created_at',
        allowedGranularities: [
          QueryDefinitionTimeGranularity.Day,
          QueryDefinitionTimeGranularity.Week,
        ],
        tags: ['sales', 'overview'],
        metadata: { domain: 'sales', token: 'must-not-leak' },
        settings: {
          visibleInBuilder: true,
          connectionString: 'postgres://user:pass@example/db',
        },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        datasetId,
        queryKey: 'sales_overview',
        metadata: { domain: 'sales' },
        settings: { visibleInBuilder: true },
        createdBy: 'dev-actor-001',
      }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [
          expect.objectContaining({
            defaultValue: undefined,
            allowedValues: ['day', true, null],
          }),
        ],
      }),
    );
    expect(result).toMatchObject({
      id: queryDefinitionId.toString(),
      tenantId: tenantId.toString(),
      datasetId: datasetId.toString(),
      queryKey: 'sales_overview',
      metadata: { domain: 'sales' },
      settings: { visibleInBuilder: true },
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(result)).not.toContain('postgres://user:pass@example/db');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: tenantId.toString(),
      actorUserId: undefined,
      action: 'query_definition.created',
      entity: 'query_definition',
      entityId: queryDefinitionId.toString(),
      metadata: {
        queryKey: 'sales_overview',
        status: QueryDefinitionStatus.Draft,
        type: QueryDefinitionType.Metric,
        datasetId: datasetId.toString(),
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('lists query definitions by tenant filters', async () => {
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<QueryDefinitionsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createQueryDefinitionDocument({
          _id: queryDefinitionId,
          tenantId,
          datasetId,
          queryKey: 'sales_overview',
          name: 'Visao geral',
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
          createdAt,
          updatedAt: createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository);

    const result = await service.findByFilters({
      tenantId: tenantId.toString(),
      datasetId: datasetId.toString(),
      status: QueryDefinitionStatus.Active,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        datasetId,
        queryKey: undefined,
        status: QueryDefinitionStatus.Active,
        type: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.queryKey).toBe('sales_overview');
  });

  it('gets one query definition using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const repository: Pick<QueryDefinitionsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(
      service.findOne(tenantId.toString(), queryDefinitionId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      queryDefinitionId.toString(),
    );
  });

  it('updates a query definition with sanitized settings and audit', async () => {
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const updatedAt = new Date('2026-04-26T13:00:00.000Z');
    const repository: Pick<QueryDefinitionsRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        createQueryDefinitionDocument({
          _id: queryDefinitionId,
          tenantId,
          datasetId: record.datasetId ?? datasetId,
          queryKey: record.queryKey ?? 'sales_overview',
          name: record.name ?? 'Visao geral',
          status: record.status ?? QueryDefinitionStatus.Active,
          type: record.type ?? QueryDefinitionType.Metric,
          metrics: record.metrics ?? [],
          dimensions: record.dimensions ?? [],
          filters: record.filters ?? [],
          sorts: record.sorts ?? [],
          allowedGranularities: record.allowedGranularities ?? [],
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
      queryDefinitionId.toString(),
      {
        name: 'Visao atualizada',
        settings: { visibleInBuilder: false, token: 'must-not-leak' },
      },
      { actorId: 'dev-actor-002' },
    );

    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      queryDefinitionId.toString(),
      expect.objectContaining({
        name: 'Visao atualizada',
        settings: { visibleInBuilder: false },
        updatedBy: 'dev-actor-002',
      }),
    );
    expect(result.settings).toEqual({ visibleInBuilder: false });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'query_definition.updated' }),
    );
  });

  it('archives a query definition using soft delete', async () => {
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const updatedAt = new Date('2026-04-26T13:30:00.000Z');
    const repository: Pick<QueryDefinitionsRepository, 'archiveByTenantAndId'> = {
      archiveByTenantAndId: jest.fn(async () =>
        createQueryDefinitionDocument({
          _id: queryDefinitionId,
          tenantId,
          datasetId,
          queryKey: 'sales_overview',
          name: 'Visao geral',
          status: QueryDefinitionStatus.Archived,
          type: QueryDefinitionType.Metric,
          metrics: [],
          dimensions: [],
          filters: [],
          sorts: [],
          allowedGranularities: [],
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

    const result = await service.archive(tenantId.toString(), queryDefinitionId.toString(), {
      actorId: 'dev-actor-003',
    });

    expect(repository.archiveByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      queryDefinitionId.toString(),
      'dev-actor-003',
    );
    expect(result.status).toBe(QueryDefinitionStatus.Archived);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'query_definition.archived' }),
    );
  });

  it('returns conflict when queryKey is duplicated for tenant', async () => {
    const repository: Pick<QueryDefinitionsRepository, 'create'> = {
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
        datasetId: new Types.ObjectId().toString(),
        queryKey: 'sales_overview',
        name: 'Visao geral',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createService(
  repository: Partial<QueryDefinitionsRepository>,
  auditService: AuditServiceMock = createAuditService(),
): QueryDefinitionsService {
  return new QueryDefinitionsService(
    repository as QueryDefinitionsRepository,
    new QueryDefinitionSanitizerService(),
    auditService as unknown as AuditService,
  );
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: new Types.ObjectId().toString(),
      tenantId: new Types.ObjectId().toString(),
      action: 'query_definition.created',
      entity: 'query_definition',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createQueryDefinitionDocument(
  record: Partial<QueryDefinitionDocument>,
): QueryDefinitionDocument {
  return record as QueryDefinitionDocument;
}
