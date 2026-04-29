import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../../audit/services/audit.service';
import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import {
  DashboardPreviewResultDto,
  DashboardPreviewWidgetStatusReason,
} from '../dto/dashboard-preview-response.dto';
import {
  DashboardPreviewRequestDto,
  QueryPreviewRequestDto,
} from '../dto/execution-preview-request.dto';
import { ExecutionPreviewMode, QueryPreviewResultDto } from '../dto/query-preview-response.dto';
import {
  DashboardPreviewWidgetSource,
  DemoDashboardPreviewGeneratorService,
} from './demo-dashboard-preview-generator.service';
import { DemoQueryPreviewGeneratorService } from './demo-query-preview-generator.service';

export interface ExecutionPreviewActorContext {
  actorId?: string;
}

@Injectable()
export class ExecutionPreviewService {
  constructor(
    private readonly queryDefinitionsService: QueryDefinitionsService,
    private readonly dashboardDefinitionsService: DashboardDefinitionsService,
    private readonly queryPreviewGenerator: DemoQueryPreviewGeneratorService,
    private readonly dashboardPreviewGenerator: DemoDashboardPreviewGeneratorService,
    private readonly auditService: AuditService,
  ) {}

  async previewQuery(
    tenantId: string,
    queryDefinitionId: string,
    request: QueryPreviewRequestDto = {},
    actor: ExecutionPreviewActorContext = {},
  ): Promise<QueryPreviewResultDto> {
    const queryDefinition = await this.queryDefinitionsService.findOne(tenantId, queryDefinitionId);
    const preview = this.queryPreviewGenerator.generate(queryDefinition, {
      rowLimit: request.rowLimit,
    });

    await this.auditService.record({
      tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action: 'execution_preview.query.generated',
      entity: 'query_definition',
      entityId: queryDefinition.id,
      metadata: {
        tenantId,
        queryDefinitionId: queryDefinition.id,
        queryKey: queryDefinition.queryKey,
        mode: ExecutionPreviewMode.Demo,
      },
    });

    return preview;
  }

  async previewDashboard(
    tenantId: string,
    dashboardDefinitionId: string,
    request: DashboardPreviewRequestDto = {},
    actor: ExecutionPreviewActorContext = {},
  ): Promise<DashboardPreviewResultDto> {
    const dashboardDefinition = await this.dashboardDefinitionsService.findOne(
      tenantId,
      dashboardDefinitionId,
    );
    const widgetSources = await Promise.all(
      dashboardDefinition.widgets.map((widget) => this.resolveWidgetSource(tenantId, widget)),
    );
    const preview = this.dashboardPreviewGenerator.generate(dashboardDefinition, widgetSources, {
      rowLimitPerWidget: request.rowLimitPerWidget,
    });

    await this.auditService.record({
      tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action: 'execution_preview.dashboard.generated',
      entity: 'dashboard_definition',
      entityId: dashboardDefinition.id,
      metadata: {
        tenantId,
        dashboardDefinitionId: dashboardDefinition.id,
        dashboardKey: dashboardDefinition.dashboardKey,
        mode: ExecutionPreviewMode.Demo,
        widgetsCount: preview.meta.widgetsCount,
        readyWidgetsCount: preview.meta.readyWidgetsCount,
      },
    });

    return preview;
  }

  private async resolveWidgetSource(
    tenantId: string,
    widget: DashboardPreviewWidgetSource['widget'],
  ): Promise<DashboardPreviewWidgetSource> {
    if (!widget.queryDefinitionId) {
      return {
        widget,
        reason: DashboardPreviewWidgetStatusReason.MissingQueryDefinition,
      };
    }

    try {
      const queryDefinition = await this.queryDefinitionsService.findOne(
        tenantId,
        widget.queryDefinitionId,
      );

      return {
        widget,
        queryDefinition,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          widget,
          reason: DashboardPreviewWidgetStatusReason.QueryDefinitionNotFound,
        };
      }

      throw error;
    }
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }
}
