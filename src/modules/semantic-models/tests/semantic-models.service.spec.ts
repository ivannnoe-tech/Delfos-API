import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { SemanticModelsRepository } from '../repositories/semantic-models.repository';
import {
  SemanticDimensionDomain,
  SemanticMeasureAggregation,
  SemanticModelDocument,
  SemanticModelStatus,
  SemanticQualityLevel,
  SemanticType,
} from '../schemas/semantic-model.schema';
import { SemanticModelSanitizerService } from '../services/semantic-model-sanitizer.service';
import { SemanticModelsService } from '../services/semantic-models.service';

type AuditServiceMock = {
  record: jest.Mock;
};

describe('SemanticModelsService', () => {
  it('creates a semantic model with sanitized free fields and safe audit', async () => {
    const semanticModelId = new Types.ObjectId();
    const tenantId = new Types.ObjectId();
    const createdAt = new Date('2026-05-17T12:00:00.000Z');
    const repository: Pick<SemanticModelsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createSemanticModelDocument({
          _id: semanticModelId,
          tenantId: record.tenantId,
          modelKey: record.modelKey,
          name: record.name,
          description: record.description,
          status: record.status ?? SemanticModelStatus.Draft,
          datasetKeys: record.datasetKeys,
          owner: record.owner,
          steward: record.steward,
          certificationOwner: record.certificationOwner,
          tags: record.tags,
          quality: record.quality,
          measures: record.measures,
          dimensions: record.dimensions,
          glossaryTerms: record.glossaryTerms,
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
        modelKey: 'comercial_semantico',
        name: 'Modelo semantico comercial',
        description: 'Agrupamento semantico declarativo',
        status: SemanticModelStatus.Draft,
        datasetKeys: ['sales_orders_demo'],
        owner: 'dev-actor-owner',
        tags: ['comercial'],
        quality: {
          score: 60,
          level: SemanticQualityLevel.Fair,
          warnings: ['Modelo sem steward.'],
        },
        measures: [
          {
            key: 'faturamento',
            name: 'Faturamento',
            aggregation: SemanticMeasureAggregation.Sum,
            semanticType: SemanticType.Currency,
            datasetKey: 'sales_orders_demo',
            fieldKey: 'total_amount',
            metadata: { domain: 'sales', token: 'must-not-leak' },
          },
        ],
        dimensions: [
          {
            key: 'cidade',
            name: 'Cidade',
            domain: SemanticDimensionDomain.Geography,
          },
        ],
        glossaryTerms: [
          {
            key: 'cliente_ativo',
            name: 'Cliente ativo',
          },
        ],
        metadata: { domain: 'sales', token: 'must-not-leak' },
        settings: { visibleInBuilder: true, authorization: 'Bearer must-not-leak' },
      },
      { actorId: 'dev-actor-001' },
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        modelKey: 'comercial_semantico',
        metadata: { domain: 'sales' },
        settings: { visibleInBuilder: true },
        createdBy: 'dev-actor-001',
      }),
    );
    expect(result).toMatchObject({
      id: semanticModelId.toString(),
      tenantId: tenantId.toString(),
      modelKey: 'comercial_semantico',
      metadata: { domain: 'sales' },
      measures: [{ key: 'faturamento', metadata: { domain: 'sales' } }],
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(auditService.record).toHaveBeenCalledWith({
      tenantId: tenantId.toString(),
      actorUserId: undefined,
      action: 'semantic_model.created',
      entity: 'semantic_model',
      entityId: semanticModelId.toString(),
      metadata: {
        modelKey: 'comercial_semantico',
        status: SemanticModelStatus.Draft,
        measuresCount: 1,
        dimensionsCount: 1,
        glossaryTermsCount: 1,
      },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('rejects duplicate measure keys within a semantic model', async () => {
    const repository: Pick<SemanticModelsRepository, 'create'> = {
      create: jest.fn(),
    };
    const service = createService(repository);

    await expect(
      service.create({
        tenantId: new Types.ObjectId().toString(),
        modelKey: 'comercial_semantico',
        name: 'Modelo',
        measures: [
          { key: 'faturamento', name: 'A', aggregation: SemanticMeasureAggregation.Sum },
          { key: 'faturamento', name: 'B', aggregation: SemanticMeasureAggregation.Count },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('lists semantic models by tenant filters', async () => {
    const tenantId = new Types.ObjectId();
    const semanticModelId = new Types.ObjectId();
    const createdAt = new Date('2026-05-17T12:00:00.000Z');
    const repository: Pick<SemanticModelsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createSemanticModelDocument({
          _id: semanticModelId,
          tenantId,
          modelKey: 'comercial_semantico',
          name: 'Modelo semantico comercial',
          status: SemanticModelStatus.Verified,
          datasetKeys: [],
          tags: [],
          quality: { warnings: [] },
          measures: [],
          dimensions: [],
          glossaryTerms: [],
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
      status: SemanticModelStatus.Verified,
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      { tenantId, modelKey: undefined, status: SemanticModelStatus.Verified },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.modelKey).toBe('comercial_semantico');
  });

  it('throws when a semantic model is not found', async () => {
    const tenantId = new Types.ObjectId();
    const semanticModelId = new Types.ObjectId();
    const repository: Pick<SemanticModelsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(
      service.findOne(tenantId.toString(), semanticModelId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      semanticModelId.toString(),
    );
  });

  it('archives a semantic model using soft delete', async () => {
    const tenantId = new Types.ObjectId();
    const semanticModelId = new Types.ObjectId();
    const updatedAt = new Date('2026-05-17T13:30:00.000Z');
    const repository: Pick<SemanticModelsRepository, 'archiveByTenantAndId'> = {
      archiveByTenantAndId: jest.fn(async () =>
        createSemanticModelDocument({
          _id: semanticModelId,
          tenantId,
          modelKey: 'comercial_semantico',
          name: 'Modelo',
          status: SemanticModelStatus.Archived,
          datasetKeys: [],
          tags: [],
          quality: { warnings: [] },
          measures: [],
          dimensions: [],
          glossaryTerms: [],
          metadata: {},
          settings: {},
          createdAt: updatedAt,
          updatedAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, auditService);

    const result = await service.archive(
      tenantId.toString(),
      semanticModelId.toString(),
      { actorId: 'dev-actor-003' },
    );

    expect(repository.archiveByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      semanticModelId.toString(),
      'dev-actor-003',
    );
    expect(result.status).toBe(SemanticModelStatus.Archived);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'semantic_model.archived' }),
    );
  });

  it('returns conflict when modelKey is duplicated for tenant', async () => {
    const repository: Pick<SemanticModelsRepository, 'create'> = {
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
        modelKey: 'comercial_semantico',
        name: 'Modelo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createService(
  repository: Partial<SemanticModelsRepository>,
  auditService: AuditServiceMock = createAuditService(),
): SemanticModelsService {
  return new SemanticModelsService(
    repository as SemanticModelsRepository,
    new SemanticModelSanitizerService(),
    auditService as unknown as AuditService,
  );
}

function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn(async () => ({
      id: new Types.ObjectId().toString(),
      tenantId: new Types.ObjectId().toString(),
      action: 'semantic_model.created',
      entity: 'semantic_model',
      metadata: {},
      timestamp: new Date().toISOString(),
    })),
  };
}

function createSemanticModelDocument(
  record: Partial<SemanticModelDocument>,
): SemanticModelDocument {
  return record as SemanticModelDocument;
}
