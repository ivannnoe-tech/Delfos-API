import { Injectable } from '@nestjs/common';

import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { SemanticDimensionDto } from '../dto/semantic-dimension.dto';
import { SemanticGlossaryTermDto } from '../dto/semantic-glossary-term.dto';
import { SemanticMeasureDto } from '../dto/semantic-measure.dto';
import { SemanticModelQualityDto } from '../dto/semantic-model-quality.dto';
import {
  SemanticDimension,
  SemanticGlossaryTerm,
  SemanticMeasure,
  SemanticModelQuality,
  SemanticModelStatus,
} from '../schemas/semantic-model.constants';

/**
 * Pure declarative sanitizer for the semantic-models module.
 *
 * It only normalizes shape and strips sensitive metadata — it never executes,
 * resolves, materializes or validates anything against a real data source.
 */
@Injectable()
export class SemanticModelSanitizerService {
  sanitizeQuality(quality?: SemanticModelQualityDto): SemanticModelQuality {
    return {
      score: quality?.score,
      level: quality?.level,
      warnings: quality?.warnings ?? [],
    };
  }

  sanitizeMeasures(measures?: SemanticMeasureDto[]): SemanticMeasure[] {
    return (measures ?? []).map((measure) => ({
      key: measure.key,
      name: measure.name,
      description: measure.description,
      aggregation: measure.aggregation,
      semanticType: measure.semanticType,
      datasetKey: measure.datasetKey,
      fieldKey: measure.fieldKey,
      unit: measure.unit,
      formatHint: measure.formatHint,
      status: measure.status ?? SemanticModelStatus.Draft,
      owner: measure.owner,
      tags: measure.tags ?? [],
      isReusable: measure.isReusable ?? false,
      warnings: measure.warnings ?? [],
      metadata: sanitizeMetadata(measure.metadata),
    }));
  }

  sanitizeDimensions(dimensions?: SemanticDimensionDto[]): SemanticDimension[] {
    return (dimensions ?? []).map((dimension) => ({
      key: dimension.key,
      name: dimension.name,
      description: dimension.description,
      semanticType: dimension.semanticType,
      domain: dimension.domain,
      datasetKey: dimension.datasetKey,
      fieldKey: dimension.fieldKey,
      cardinalityHint: dimension.cardinalityHint,
      status: dimension.status ?? SemanticModelStatus.Draft,
      owner: dimension.owner,
      tags: dimension.tags ?? [],
      warnings: dimension.warnings ?? [],
      metadata: sanitizeMetadata(dimension.metadata),
    }));
  }

  sanitizeGlossaryTerms(terms?: SemanticGlossaryTermDto[]): SemanticGlossaryTerm[] {
    return (terms ?? []).map((term) => ({
      key: term.key,
      name: term.name,
      description: term.description,
      aliases: term.aliases ?? [],
      domain: term.domain,
      relatedMeasureKeys: term.relatedMeasureKeys ?? [],
      relatedDimensionKeys: term.relatedDimensionKeys ?? [],
      status: term.status ?? SemanticModelStatus.Draft,
      owner: term.owner,
      tags: term.tags ?? [],
      metadata: sanitizeMetadata(term.metadata),
    }));
  }
}
