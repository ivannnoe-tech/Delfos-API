import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { CreateSemanticModelDto } from '../dto/create-semantic-model.dto';
import {
  ListSemanticModelsQueryDto,
  SemanticModelTenantQueryDto,
} from '../dto/semantic-model-query.dto';
import {
  SemanticDimensionResponseDto,
  SemanticGlossaryTermResponseDto,
  SemanticMeasureResponseDto,
  SemanticModelQualityResponseDto,
  SemanticModelResponseDto,
} from '../dto/semantic-model-response.dto';
import { UpdateSemanticModelDto } from '../dto/update-semantic-model.dto';
import {
  SemanticModelsRepository,
  UpdateSemanticModelRecord,
} from '../repositories/semantic-models.repository';
import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModelDocument,
  SemanticModelQuality,
} from '../schemas/semantic-model.schema';
import { SemanticModelSanitizerService } from './semantic-model-sanitizer.service';

export interface SemanticModelActorContext {
  actorId?: string;
}

@Injectable()
export class SemanticModelsService {
  constructor(
    private readonly semanticModelsRepository: SemanticModelsRepository,
    private readonly semanticModelSanitizer: SemanticModelSanitizerService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateSemanticModelDto,
    actor: SemanticModelActorContext = {},
  ): Promise<SemanticModelResponseDto> {
    const measures = this.semanticModelSanitizer.sanitizeMeasures(dto.measures);
    const dimensions = this.semanticModelSanitizer.sanitizeDimensions(dto.dimensions);
    const glossaryTerms = this.semanticModelSanitizer.sanitizeGlossaryTerms(dto.glossaryTerms);
    this.assertUniqueNestedKeys(measures, dimensions, glossaryTerms);

    try {
      const semanticModel = await this.semanticModelsRepository.create({
        tenantId: new Types.ObjectId(dto.tenantId),
        modelKey: dto.modelKey,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        datasetKeys: dto.datasetKeys ?? [],
        owner: dto.owner,
        steward: dto.steward,
        certificationOwner: dto.certificationOwner,
        tags: dto.tags ?? [],
        quality: this.semanticModelSanitizer.sanitizeQuality(dto.quality),
        measures,
        dimensions,
        glossaryTerms,
        metadata: sanitizeMetadata(dto.metadata),
        settings: sanitizeMetadata(dto.settings),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      });

      await this.recordAudit('semantic_model.created', semanticModel, actor);

      return this.toResponse(semanticModel);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findByFilters(
    query: ListSemanticModelsQueryDto,
  ): Promise<ListResponse<SemanticModelResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      modelKey: query.modelKey,
      status: query.status,
    };
    const [items, total] = await Promise.all([
      this.semanticModelsRepository.findByFilters(filters, query.page, query.pageSize),
      this.semanticModelsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((semanticModel) => this.toResponse(semanticModel)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(
    tenantId: SemanticModelTenantQueryDto['tenantId'],
    id: string,
  ): Promise<SemanticModelResponseDto> {
    const semanticModel = await this.semanticModelsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

    if (!semanticModel) {
      throw new NotFoundException('Semantic model not found.');
    }

    return this.toResponse(semanticModel);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSemanticModelDto,
    actor: SemanticModelActorContext = {},
  ): Promise<SemanticModelResponseDto> {
    try {
      const semanticModel = await this.semanticModelsRepository.updateByTenantAndId(
        new Types.ObjectId(tenantId),
        id,
        this.toUpdateRecord(dto, actor),
      );

      if (!semanticModel) {
        throw new NotFoundException('Semantic model not found.');
      }

      await this.recordAudit('semantic_model.updated', semanticModel, actor);

      return this.toResponse(semanticModel);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async archive(
    tenantId: string,
    id: string,
    actor: SemanticModelActorContext = {},
  ): Promise<SemanticModelResponseDto> {
    const semanticModel = await this.semanticModelsRepository.archiveByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      actor.actorId,
    );

    if (!semanticModel) {
      throw new NotFoundException('Semantic model not found.');
    }

    await this.recordAudit('semantic_model.archived', semanticModel, actor);

    return this.toResponse(semanticModel);
  }

  private toUpdateRecord(
    dto: UpdateSemanticModelDto,
    actor: SemanticModelActorContext,
  ): UpdateSemanticModelRecord {
    const measures =
      dto.measures !== undefined
        ? this.semanticModelSanitizer.sanitizeMeasures(dto.measures)
        : undefined;
    const dimensions =
      dto.dimensions !== undefined
        ? this.semanticModelSanitizer.sanitizeDimensions(dto.dimensions)
        : undefined;
    const glossaryTerms =
      dto.glossaryTerms !== undefined
        ? this.semanticModelSanitizer.sanitizeGlossaryTerms(dto.glossaryTerms)
        : undefined;

    if (measures !== undefined || dimensions !== undefined || glossaryTerms !== undefined) {
      this.assertUniqueNestedKeys(measures ?? [], dimensions ?? [], glossaryTerms ?? []);
    }

    return {
      ...(dto.modelKey !== undefined ? { modelKey: dto.modelKey } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.datasetKeys !== undefined ? { datasetKeys: dto.datasetKeys } : {}),
      ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
      ...(dto.steward !== undefined ? { steward: dto.steward } : {}),
      ...(dto.certificationOwner !== undefined
        ? { certificationOwner: dto.certificationOwner }
        : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.quality !== undefined
        ? { quality: this.semanticModelSanitizer.sanitizeQuality(dto.quality) }
        : {}),
      ...(measures !== undefined ? { measures } : {}),
      ...(dimensions !== undefined ? { dimensions } : {}),
      ...(glossaryTerms !== undefined ? { glossaryTerms } : {}),
      ...(dto.metadata !== undefined ? { metadata: sanitizeMetadata(dto.metadata) } : {}),
      ...(dto.settings !== undefined ? { settings: sanitizeMetadata(dto.settings) } : {}),
      updatedBy: actor.actorId,
    };
  }

  /**
   * Declarative consistency check only — nested keys must be unique within the
   * model. It validates shape, never data.
   */
  private assertUniqueNestedKeys(
    measures: SemanticMeasure[],
    dimensions: SemanticDimension[],
    glossaryTerms: SemanticGlossaryTerm[],
  ): void {
    this.assertUniqueKeys(
      measures.map((measure) => measure.key),
      'measure',
    );
    this.assertUniqueKeys(
      dimensions.map((dimension) => dimension.key),
      'dimension',
    );
    this.assertUniqueKeys(
      glossaryTerms.map((term) => term.key),
      'glossary term',
    );
  }

  private assertUniqueKeys(keys: string[], label: string): void {
    const seen = new Set<string>();
    for (const key of keys) {
      if (seen.has(key)) {
        throw new BadRequestException(`Duplicate ${label} key in semantic model: ${key}.`);
      }
      seen.add(key);
    }
  }

  private async recordAudit(
    action: string,
    semanticModel: SemanticModelDocument,
    actor: SemanticModelActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: semanticModel.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'semantic_model',
      entityId: semanticModel._id.toString(),
      metadata: {
        modelKey: semanticModel.modelKey,
        status: semanticModel.status,
        measuresCount: semanticModel.measures.length,
        dimensionsCount: semanticModel.dimensions.length,
        glossaryTermsCount: semanticModel.glossaryTerms.length,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(semanticModel: SemanticModelDocument): SemanticModelResponseDto {
    return {
      id: semanticModel._id.toString(),
      tenantId: semanticModel.tenantId.toString(),
      modelKey: semanticModel.modelKey,
      name: semanticModel.name,
      description: semanticModel.description,
      status: semanticModel.status,
      datasetKeys: semanticModel.datasetKeys,
      owner: semanticModel.owner,
      steward: semanticModel.steward,
      certificationOwner: semanticModel.certificationOwner,
      tags: semanticModel.tags,
      quality: this.toQualityResponse(semanticModel.quality),
      measures: semanticModel.measures.map((measure) => this.toMeasureResponse(measure)),
      dimensions: semanticModel.dimensions.map((dimension) => this.toDimensionResponse(dimension)),
      glossaryTerms: semanticModel.glossaryTerms.map((term) => this.toGlossaryTermResponse(term)),
      metadata: semanticModel.metadata,
      settings: semanticModel.settings,
      createdAt: semanticModel.createdAt.toISOString(),
      updatedAt: semanticModel.updatedAt.toISOString(),
      createdBy: semanticModel.createdBy,
      updatedBy: semanticModel.updatedBy,
    };
  }

  private toQualityResponse(quality: SemanticModelQuality): SemanticModelQualityResponseDto {
    return {
      score: quality.score,
      level: quality.level,
      warnings: quality.warnings,
    };
  }

  private toMeasureResponse(measure: SemanticMeasure): SemanticMeasureResponseDto {
    return {
      key: measure.key,
      name: measure.name,
      description: measure.description,
      aggregation: measure.aggregation,
      semanticType: measure.semanticType,
      datasetKey: measure.datasetKey,
      fieldKey: measure.fieldKey,
      unit: measure.unit,
      formatHint: measure.formatHint,
      status: measure.status,
      owner: measure.owner,
      tags: measure.tags,
      isReusable: measure.isReusable,
      warnings: measure.warnings,
      metadata: measure.metadata,
    };
  }

  private toDimensionResponse(dimension: SemanticDimension): SemanticDimensionResponseDto {
    return {
      key: dimension.key,
      name: dimension.name,
      description: dimension.description,
      semanticType: dimension.semanticType,
      domain: dimension.domain,
      datasetKey: dimension.datasetKey,
      fieldKey: dimension.fieldKey,
      cardinalityHint: dimension.cardinalityHint,
      status: dimension.status,
      owner: dimension.owner,
      tags: dimension.tags,
      warnings: dimension.warnings,
      metadata: dimension.metadata,
    };
  }

  private toGlossaryTermResponse(term: SemanticGlossaryTerm): SemanticGlossaryTermResponseDto {
    return {
      key: term.key,
      name: term.name,
      description: term.description,
      aliases: term.aliases,
      domain: term.domain,
      relatedMeasureKeys: term.relatedMeasureKeys,
      relatedDimensionKeys: term.relatedDimensionKeys,
      status: term.status,
      owner: term.owner,
      tags: term.tags,
      metadata: term.metadata,
    };
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }

    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException('Semantic model key already exists for tenant.');
    }

    throw error;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }
}
