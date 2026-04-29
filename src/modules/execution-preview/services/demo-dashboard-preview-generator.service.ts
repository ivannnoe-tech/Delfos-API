import { Injectable } from '@nestjs/common';

import {
  DashboardDefinitionResponseDto,
  DashboardDefinitionVisualizationResponseDto,
  DashboardDefinitionWidgetResponseDto,
} from '../../dashboard-definitions/dto/dashboard-definition-response.dto';
import { DashboardDefinitionChartType } from '../../dashboard-definitions/schemas/dashboard-definition.schema';
import { QueryDefinitionResponseDto } from '../../query-definitions/dto/query-definition-response.dto';
import { QueryDefinitionType } from '../../query-definitions/schemas/query-definition.schema';
import {
  DashboardPreviewResultDto,
  DashboardPreviewVisualizationDto,
  DashboardPreviewWidgetDto,
  DashboardPreviewWidgetStatus,
  DashboardPreviewWidgetStatusReason,
} from '../dto/dashboard-preview-response.dto';
import { ExecutionPreviewMode } from '../dto/query-preview-response.dto';
import { DemoQueryPreviewGeneratorService } from './demo-query-preview-generator.service';

export interface DashboardPreviewWidgetSource {
  widget: DashboardDefinitionWidgetResponseDto;
  queryDefinition?: QueryDefinitionResponseDto;
  reason?: DashboardPreviewWidgetStatusReason;
}

export interface DemoDashboardPreviewOptions {
  generatedAt?: Date;
  rowLimitPerWidget?: number;
}

@Injectable()
export class DemoDashboardPreviewGeneratorService {
  constructor(private readonly queryPreviewGenerator: DemoQueryPreviewGeneratorService) {}

  generate(
    dashboardDefinition: DashboardDefinitionResponseDto,
    widgetSources: DashboardPreviewWidgetSource[],
    options: DemoDashboardPreviewOptions = {},
  ): DashboardPreviewResultDto {
    const generatedAt = options.generatedAt ?? new Date();
    const widgets = widgetSources.map((source) =>
      this.generateWidgetPreview(source, generatedAt, options.rowLimitPerWidget),
    );
    const readyWidgetsCount = widgets.filter(
      (widget) => widget.status === DashboardPreviewWidgetStatus.Ready,
    ).length;

    return {
      mode: ExecutionPreviewMode.Demo,
      dashboardDefinitionId: dashboardDefinition.id,
      dashboardKey: dashboardDefinition.dashboardKey,
      generatedAt: generatedAt.toISOString(),
      widgets,
      meta: {
        isPreview: true,
        source: 'demo-generator',
        widgetsCount: widgets.length,
        readyWidgetsCount,
      },
    };
  }

  private generateWidgetPreview(
    source: DashboardPreviewWidgetSource,
    generatedAt: Date,
    rowLimitPerWidget?: number,
  ): DashboardPreviewWidgetDto {
    if (!source.queryDefinition) {
      return {
        widgetKey: source.widget.key,
        title: source.widget.title,
        type: source.widget.type,
        queryDefinitionId: source.widget.queryDefinitionId,
        status: DashboardPreviewWidgetStatus.Degraded,
        reason: source.reason ?? DashboardPreviewWidgetStatusReason.MissingQueryDefinition,
        visualization: this.toVisualization(source.widget.visualization),
        data: {
          columns: [],
          rows: [],
        },
      };
    }

    const queryPreview = this.queryPreviewGenerator.generate(source.queryDefinition, {
      generatedAt,
      rowLimit: rowLimitPerWidget,
    });

    return {
      widgetKey: source.widget.key,
      title: source.widget.title,
      type: source.widget.type,
      queryDefinitionId: source.widget.queryDefinitionId,
      status: DashboardPreviewWidgetStatus.Ready,
      visualization: this.toVisualization(source.widget.visualization, source.queryDefinition),
      data: {
        columns: queryPreview.columns,
        rows: queryPreview.rows,
      },
    };
  }

  private toVisualization(
    visualization?: DashboardDefinitionVisualizationResponseDto,
    queryDefinition?: QueryDefinitionResponseDto,
  ): DashboardPreviewVisualizationDto {
    return {
      chartType: visualization?.chartType ?? this.defaultChartType(queryDefinition),
      xField:
        visualization?.xField ??
        queryDefinition?.dimensions[0]?.key ??
        (queryDefinition?.timeField ? 'period' : undefined),
      yFields:
        visualization?.yFields && visualization.yFields.length > 0
          ? visualization.yFields
          : (queryDefinition?.metrics.map((metric) => metric.key) ?? []),
      groupBy: visualization?.groupBy,
      format: visualization?.format ?? queryDefinition?.metrics[0]?.format,
    };
  }

  private defaultChartType(
    queryDefinition: QueryDefinitionResponseDto | undefined,
  ): DashboardDefinitionChartType | undefined {
    if (!queryDefinition) {
      return undefined;
    }

    if (queryDefinition.type === QueryDefinitionType.Table) {
      return DashboardDefinitionChartType.Table;
    }

    if (queryDefinition.type === QueryDefinitionType.Timeseries) {
      return DashboardDefinitionChartType.Line;
    }

    if (queryDefinition.metrics.length === 1 && queryDefinition.dimensions.length === 0) {
      return DashboardDefinitionChartType.Number;
    }

    return DashboardDefinitionChartType.Bar;
  }
}
