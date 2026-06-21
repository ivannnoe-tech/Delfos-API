import { Injectable } from '@nestjs/common';

import {
  isSensitiveMetadataValue,
  sanitizeMetadata,
  SanitizedMetadataValue,
} from '../../../core/utils/sanitize-metadata';
import { DashboardDefinitionWidgetRecord } from '../repositories/dashboard-definitions.repository';
import { DashboardDefinitionFilterDto } from '../dto/dashboard-definition-filter.dto';
import { DashboardDefinitionLayoutDto } from '../dto/dashboard-definition-layout.dto';
import {
  DashboardDefinitionVisualizationDto,
  DashboardDefinitionWidgetDto,
} from '../dto/dashboard-definition-widget.dto';
import { DashboardDefinitionSectionDto } from '../dto/dashboard-definition-section.dto';
import {
  DashboardDefinitionFilter,
  DashboardDefinitionLayout,
  DashboardDefinitionLayoutType,
  DashboardDefinitionSection,
  DashboardDefinitionVisualization,
} from '../schemas/dashboard-definition.constants';

@Injectable()
export class DashboardDefinitionSanitizerService {
  sanitizeLayout(layout?: DashboardDefinitionLayoutDto): DashboardDefinitionLayout {
    return {
      type: layout?.type ?? DashboardDefinitionLayoutType.Grid,
      columns: layout?.columns,
      gap: layout?.gap,
      density: layout?.density,
    };
  }

  sanitizeSections(sections?: DashboardDefinitionSectionDto[]): DashboardDefinitionSection[] {
    return (sections ?? []).map((section) => ({
      key: section.key,
      title: section.title,
      description: section.description,
      order: section.order,
      layout: section.layout ? this.sanitizeLayout(section.layout) : undefined,
    }));
  }

  sanitizeWidgets(widgets?: DashboardDefinitionWidgetDto[]): DashboardDefinitionWidgetRecord[] {
    return (widgets ?? []).map((widget) => ({
      key: widget.key,
      title: widget.title,
      description: widget.description,
      type: widget.type,
      queryDefinitionId: widget.queryDefinitionId,
      sectionKey: widget.sectionKey,
      order: widget.order,
      size: widget.size,
      position: widget.position,
      visualization: this.sanitizeVisualization(widget.visualization),
      options: sanitizeMetadata(widget.options),
    }));
  }

  sanitizeFilters(filters?: DashboardDefinitionFilterDto[]): DashboardDefinitionFilter[] {
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

  private sanitizeVisualization(
    visualization?: DashboardDefinitionVisualizationDto,
  ): DashboardDefinitionVisualization | undefined {
    if (!visualization) {
      return undefined;
    }

    return {
      chartType: visualization.chartType,
      xField: visualization.xField,
      yFields: visualization.yFields ?? [],
      groupBy: visualization.groupBy,
      format: visualization.format,
    };
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
