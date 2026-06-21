import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AuditService } from '../../audit/services/audit.service';
import { DatasetRecord, DatasetsRepository } from '../repositories/datasets.repository';
import {
  DatasetFieldType,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../schemas/dataset.schema';
import { DatasetFieldSanitizerService } from '../services/dataset-field-sanitizer.service';
import { DatasetsService } from '../services/datasets.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('DatasetsService', () => {
  it('creates a dataset with sanitized metadata/settings and safe audit', async () => {
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const connectionId = '662d4f6e7a1c2b00124f0201';
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<DatasetsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        buildDatasetRecord({
          id: datasetId,
          tenantId: record.tenantId,
          connectionId: record.connectionId,
          datasetKey: record.datasetKey,
          name: record.name,
          description: record.description,
          sourceType: record.sourceType ?? DatasetSourceType.Api,
          status: record.status ?? DatasetStatus.Draft,
          refreshMode: record.refreshMode ?? DatasetRefreshMode.Manual,
          schemaMode: record.schemaMode ?? DatasetSchemaMode.Declared,
          fields: record.fields,
          primaryKeyFields: record.primaryKeyFields,
          timeField: record.timeField,
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
        connectionId,
        datasetKey: 'sales_orders',
        name: 'Pedidos de venda',
        description: 'Dataset logico para pedidos de venda',
        sourceType: DatasetSourceType.Database,
        refreshMode: DatasetRefreshMode.Manual,
        schemaMode: DatasetSchemaMode.Declared,
        fields: [
          {
            key: 'order_id',
            label: 'Codigo do pedido',
            type: DatasetFieldType.String,
            required: true,
            description: 'Identificador do pedido',
          },
        ],
        primaryKeyFields: ['order_id'],
        timeField: 'created_at',
        tags: ['sales', 'orders'],
        metadata: { domain: 'sales', token: 'must-not-leak' },
        settings: { defaultPageSize: 50, connectionString: 'postgres://user:pass@example/db' },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        connectionId,
        datasetKey: 'sales_orders',
        metadata: { domain: 'sales' },
        settings: { defaultPageSize: 50 },
        createdBy: 'dev-actor-001',
      }),
    );
    expect(result).toMatchObject({
      id: datasetId,
      tenantId,
      connectionId,
      datasetKey: 'sales_orders',
      metadata: { domain: 'sales' },
      settings: { defaultPageSize: 50 },
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(result)).not.toContain('postgres://user:pass@example/db');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId,
      actorUserId: undefined,
      action: 'dataset.created',
      entity: 'dataset',
      entityId: datasetId,
      metadata: {
        datasetKey: 'sales_orders',
        status: DatasetStatus.Draft,
        sourceType: DatasetSourceType.Database,
        connectionId,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('lists datasets by tenant filters', async () => {
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<DatasetsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        buildDatasetRecord({
          id: datasetId,
          tenantId,
          datasetKey: 'sales_orders',
          name: 'Pedidos',
          sourceType: DatasetSourceType.Api,
          status: DatasetStatus.Active,
          refreshMode: DatasetRefreshMode.Manual,
          schemaMode: DatasetSchemaMode.Declared,
          fields: [],
          primaryKeyFields: [],
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
      status: DatasetStatus.Active,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        connectionId: undefined,
        datasetKey: undefined,
        status: DatasetStatus.Active,
        sourceType: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.datasetKey).toBe('sales_orders');
  });

  it('gets one dataset using tenant scoped lookup', async () => {
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const repository: Pick<DatasetsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(service.findOne(tenantId, datasetId)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(tenantId, datasetId);
  });

  it('updates a dataset with sanitized settings and audit', async () => {
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const updatedAt = new Date('2026-04-26T13:00:00.000Z');
    const repository: Pick<DatasetsRepository, 'updateByTenantAndId'> = {
      updateByTenantAndId: jest.fn(async (_tenantId, _id, record) =>
        buildDatasetRecord({
          id: datasetId,
          tenantId,
          datasetKey: record.datasetKey ?? 'sales_orders',
          name: record.name ?? 'Pedidos',
          sourceType: DatasetSourceType.Api,
          status: DatasetStatus.Active,
          refreshMode: DatasetRefreshMode.Manual,
          schemaMode: DatasetSchemaMode.Declared,
          fields: record.fields ?? [],
          primaryKeyFields: [],
          tags: [],
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
      datasetId,
      {
        name: 'Pedidos atualizados',
        settings: { defaultPageSize: 25, token: 'must-not-leak' },
      },
      { actorId: 'dev-actor-002' },
    );

    expect(repository.updateByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      datasetId,
      expect.objectContaining({
        name: 'Pedidos atualizados',
        settings: { defaultPageSize: 25 },
        updatedBy: 'dev-actor-002',
      }),
    );
    expect(result.settings).toEqual({ defaultPageSize: 25 });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dataset.updated' }),
    );
  });

  it('archives a dataset using soft delete', async () => {
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const updatedAt = new Date('2026-04-26T13:30:00.000Z');
    const repository: Pick<DatasetsRepository, 'archiveByTenantAndId'> = {
      archiveByTenantAndId: jest.fn(async () =>
        buildDatasetRecord({
          id: datasetId,
          tenantId,
          datasetKey: 'sales_orders',
          name: 'Pedidos',
          sourceType: DatasetSourceType.Api,
          status: DatasetStatus.Archived,
          refreshMode: DatasetRefreshMode.Manual,
          schemaMode: DatasetSchemaMode.Declared,
          fields: [],
          primaryKeyFields: [],
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

    const result = await service.archive(tenantId, datasetId, {
      actorId: 'dev-actor-003',
    });

    expect(repository.archiveByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      datasetId,
      'dev-actor-003',
    );
    expect(result.status).toBe(DatasetStatus.Archived);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dataset.archived' }),
    );
  });

  it('returns conflict when datasetKey is duplicated for tenant', async () => {
    const repository: Pick<DatasetsRepository, 'create'> = {
      create: jest.fn(async () => {
        const error = new Error('duplicate key') as Error & { code: number };
        error.code = 11000;
        throw error;
      }),
    };
    const service = createService(repository);

    await expect(
      service.create({
        tenantId: '662d4f6e7a1c2b00124f0001',
        datasetKey: 'sales_orders',
        name: 'Pedidos',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a PostgreSQL unique violation to a conflict', async () => {
    const repository: Pick<DatasetsRepository, 'create'> = {
      create: jest.fn(async () => {
        const error = new Error('duplicate key value violates unique constraint') as Error & {
          code: string;
        };
        error.code = '23505';
        throw error;
      }),
    };
    const service = createService(repository);

    await expect(
      service.create({
        tenantId: '662d4f6e7a1c2b00124f0001',
        datasetKey: 'sales_orders',
        name: 'Pedidos',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('supports datasets without connectionId', async () => {
    const datasetId = '662d4f6e7a1c2b00124f0501';
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const createdAt = new Date('2026-04-26T12:00:00.000Z');
    const repository: Pick<DatasetsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        buildDatasetRecord({
          id: datasetId,
          tenantId: record.tenantId,
          datasetKey: record.datasetKey,
          name: record.name,
          sourceType: DatasetSourceType.Manual,
          status: DatasetStatus.Draft,
          refreshMode: DatasetRefreshMode.None,
          schemaMode: DatasetSchemaMode.Declared,
          fields: [],
          primaryKeyFields: [],
          tags: [],
          metadata: {},
          settings: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const service = createService(repository);

    const result = await service.create({
      tenantId,
      datasetKey: 'manual_metrics',
      name: 'Metricas manuais',
      sourceType: DatasetSourceType.Manual,
      refreshMode: DatasetRefreshMode.None,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: undefined }),
    );
    expect(result.connectionId).toBeUndefined();
  });
});

function createService(
  repository: Partial<DatasetsRepository>,
  auditService: AuditServiceMock = createAuditService(),
): DatasetsService {
  return new DatasetsService(
    repository as DatasetsRepository,
    new DatasetFieldSanitizerService(),
    auditService as unknown as AuditService,
  );
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: randomUUID(),
      tenantId: randomUUID(),
      action: 'dataset.created',
      entity: 'dataset',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function buildDatasetRecord(record: Partial<DatasetRecord>): DatasetRecord {
  return record as DatasetRecord;
}
