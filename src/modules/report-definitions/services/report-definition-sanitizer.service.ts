import { Injectable } from '@nestjs/common';

import {
  isSensitiveMetadataValue,
  sanitizeMetadata,
  SanitizedMetadataValue,
} from '../../../core/utils/sanitize-metadata';
import { ReportDefinitionBlockDto } from '../dto/report-definition-block.dto';
import { ReportDefinitionFilterDto } from '../dto/report-definition-filter.dto';
import { ReportDefinitionLayoutDto } from '../dto/report-definition-layout.dto';
import { ReportDefinitionParameterDto } from '../dto/report-definition-parameter.dto';
import { ReportDefinitionSectionDto } from '../dto/report-definition-section.dto';
import { ReportDefinitionBlockRecord } from '../repositories/report-definitions.repository';
import {
  ReportDefinitionFilter,
  ReportDefinitionLayout,
  ReportDefinitionLayoutType,
  ReportDefinitionParameter,
  ReportDefinitionSection,
} from '../schemas/report-definition.schema';

@Injectable()
export class ReportDefinitionSanitizerService {
  sanitizeLayout(layout?: ReportDefinitionLayoutDto): ReportDefinitionLayout {
    return {
      type: layout?.type ?? ReportDefinitionLayoutType.Paged,
      columns: layout?.columns,
      density: layout?.density,
    };
  }

  sanitizeSections(sections?: ReportDefinitionSectionDto[]): ReportDefinitionSection[] {
    return (sections ?? []).map((section) => ({
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout ? this.sanitizeLayout(section.layout) : undefined,
    }));
  }

  sanitizeBlocks(blocks?: ReportDefinitionBlockDto[]): ReportDefinitionBlockRecord[] {
    return (blocks ?? []).map((block) => ({
      key: block.key,
      title: block.title,
      description: block.description,
      type: block.type,
      queryDefinitionId: block.queryDefinitionId,
      dashboardDefinitionId: block.dashboardDefinitionId,
      sectionKey: block.sectionKey,
      order: block.order,
      options: sanitizeMetadata(block.options),
    }));
  }

  sanitizeFilters(filters?: ReportDefinitionFilterDto[]): ReportDefinitionFilter[] {
    return (filters ?? []).map((filter) => ({
      key: filter.key,
      label: filter.label,
      field: filter.field,
      operator: filter.operator,
      required: filter.required ?? false,
      defaultValue: this.sanitizeValue(filter.defaultValue),
      allowedValues: this.sanitizeValues(filter.allowedValues),
    }));
  }

  sanitizeParameters(parameters?: ReportDefinitionParameterDto[]): ReportDefinitionParameter[] {
    return (parameters ?? []).map((parameter) => ({
      key: parameter.key,
      label: parameter.label,
      type: parameter.type,
      required: parameter.required ?? false,
      defaultValue: this.sanitizeValue(parameter.defaultValue),
      allowedValues: this.sanitizeValues(parameter.allowedValues),
    }));
  }

  private sanitizeValues(values?: unknown[]): SanitizedMetadataValue[] {
    return (values ?? []).flatMap((value) => {
      const sanitized = this.sanitizeValue(value);

      return sanitized === undefined ? [] : [sanitized];
    });
  }

  private sanitizeValue(value: unknown): SanitizedMetadataValue | undefined {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    if (isSensitiveMetadataValue(value)) {
      return undefined;
    }

    return value.slice(0, 500);
  }
}
