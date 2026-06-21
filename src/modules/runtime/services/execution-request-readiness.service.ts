import { Injectable, NotFoundException } from '@nestjs/common';

import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import { DatasetStatus } from '../../datasets/schemas/dataset.schema';
import { DatasetsService } from '../../datasets/services/datasets.service';
import { FieldMappingStatus } from '../../field-mappings/schemas/field-mapping.schema';
import { FieldMappingsService } from '../../field-mappings/services/field-mappings.service';
import { QueryDefinitionStatus } from '../../query-definitions/schemas/query-definition.schema';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import { ReportDefinitionsService } from '../../report-definitions/services/report-definitions.service';
import { ExecutionRequestReadinessItemDto } from '../dto/execution-request-dry-run-response.dto';
import { ExecutionRequestRecord } from '../repositories/execution-requests.repository';
import { ExecutionRequestKind } from '../schemas/execution-request.schema';

export interface ReadinessAccumulator {
  checks: ExecutionRequestReadinessItemDto[];
  warnings: ExecutionRequestReadinessItemDto[];
  blockers: ExecutionRequestReadinessItemDto[];
}

@Injectable()
export class ExecutionRequestReadinessService {
  constructor(
    private readonly queryDefinitionsService: QueryDefinitionsService,
    private readonly dashboardDefinitionsService: DashboardDefinitionsService,
    private readonly reportDefinitionsService: ReportDefinitionsService,
    private readonly datasetsService: DatasetsService,
    private readonly fieldMappingsService: FieldMappingsService,
  ) {}

  async evaluate(executionRequest: ExecutionRequestRecord): Promise<ReadinessAccumulator> {
    switch (executionRequest.kind) {
      case ExecutionRequestKind.Query:
        return this.evaluateQuery(
          executionRequest.tenantId,
          executionRequest.queryDefinitionId,
          'executionRequest.queryDefinitionId',
        );
      case ExecutionRequestKind.Dashboard:
        return this.evaluateDashboard(
          executionRequest.tenantId,
          executionRequest.dashboardDefinitionId,
          'executionRequest.dashboardDefinitionId',
        );
      case ExecutionRequestKind.Report:
        return this.evaluateReport(
          executionRequest.tenantId,
          executionRequest.reportDefinitionId,
          'executionRequest.reportDefinitionId',
        );
    }
  }

  private async evaluateQuery(
    tenantId: string,
    queryDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!queryDefinitionId) {
      this.addBlocker(
        readiness,
        'query_definition_id_missing',
        'queryDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'query_definition_id_present',
      'queryDefinitionId is configured.',
      target,
    );
    const queryDefinition = await this.findQueryDefinition(tenantId, queryDefinitionId);

    if (!queryDefinition) {
      this.addBlocker(
        readiness,
        'query_definition_not_found',
        'Query definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'query_definition_found',
      'Query definition exists for this tenant.',
      target,
    );

    if (queryDefinition.status !== QueryDefinitionStatus.Active) {
      this.addWarning(
        readiness,
        'query_definition_not_active',
        'Query definition status is not active.',
        target,
      );
    }

    await this.evaluateDataset(
      tenantId,
      queryDefinition.datasetId,
      readiness,
      `${target}.datasetId`,
    );

    return readiness;
  }

  private async evaluateDataset(
    tenantId: string,
    datasetId: string | undefined,
    readiness: ReadinessAccumulator,
    target: string,
  ): Promise<void> {
    if (!datasetId) {
      this.addBlocker(
        readiness,
        'dataset_id_missing',
        'datasetId is required by the query definition.',
        target,
      );
      return;
    }

    this.addCheck(readiness, 'dataset_id_present', 'datasetId is configured.', target);
    const dataset = await this.findDataset(tenantId, datasetId);

    if (!dataset) {
      this.addBlocker(
        readiness,
        'dataset_not_found',
        'Dataset was not found for this tenant.',
        target,
      );
      return;
    }

    this.addCheck(readiness, 'dataset_found', 'Dataset exists for this tenant.', target);

    if (dataset.status !== DatasetStatus.Active) {
      this.addWarning(readiness, 'dataset_not_active', 'Dataset status is not active.', target);
    }

    if (!dataset.datasetKey) {
      this.addBlocker(
        readiness,
        'dataset_key_missing',
        'Dataset key is required for field mappings.',
        target,
      );
      return;
    }

    this.addCheck(
      readiness,
      'dataset_key_present',
      'Dataset key is configured.',
      `${target}.datasetKey`,
    );
    const mappings = await this.fieldMappingsService.findByFilters({
      tenantId,
      datasetKey: dataset.datasetKey,
      page: 1,
      pageSize: 1000,
    });

    if (mappings.items.length === 0) {
      this.addBlocker(
        readiness,
        'field_mappings_missing',
        'No field mappings are configured for this dataset key.',
        `${target}.fieldMappings`,
      );
      return;
    }

    this.addCheck(
      readiness,
      'field_mappings_found',
      'Field mappings exist for this dataset key.',
      `${target}.fieldMappings`,
    );

    const inactiveCount = mappings.items.filter(
      (mapping) => mapping.status !== FieldMappingStatus.Active,
    ).length;

    if (inactiveCount > 0) {
      this.addWarning(
        readiness,
        'field_mappings_incomplete',
        'Some field mappings are not active.',
        `${target}.fieldMappings`,
      );
    }
  }

  private async evaluateDashboard(
    tenantId: string,
    dashboardDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!dashboardDefinitionId) {
      this.addBlocker(
        readiness,
        'dashboard_definition_id_missing',
        'dashboardDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_definition_id_present',
      'dashboardDefinitionId is configured.',
      target,
    );
    const dashboardDefinition = await this.findDashboardDefinition(tenantId, dashboardDefinitionId);

    if (!dashboardDefinition) {
      this.addBlocker(
        readiness,
        'dashboard_definition_not_found',
        'Dashboard definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_definition_found',
      'Dashboard definition exists for this tenant.',
      target,
    );

    if (dashboardDefinition.widgets.length === 0) {
      this.addBlocker(
        readiness,
        'dashboard_widgets_missing',
        'Dashboard has no widgets configured.',
        `${target}.widgets`,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'dashboard_widgets_found',
      'Dashboard widgets are configured.',
      `${target}.widgets`,
    );
    let resolvableWidgetsCount = 0;

    for (const widget of dashboardDefinition.widgets) {
      const widgetTarget = `${target}.widgets.${widget.key}`;

      if (!widget.queryDefinitionId) {
        this.addWarning(
          readiness,
          'dashboard_widget_query_missing',
          'Dashboard widget has no queryDefinitionId.',
          widgetTarget,
        );
        continue;
      }

      resolvableWidgetsCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateQuery(tenantId, widget.queryDefinitionId, widgetTarget),
      );
    }

    if (resolvableWidgetsCount === 0) {
      this.addBlocker(
        readiness,
        'dashboard_has_no_resolvable_queries',
        'Dashboard has no widgets with a queryDefinitionId.',
        `${target}.widgets`,
      );
    }

    return readiness;
  }

  private async evaluateReport(
    tenantId: string,
    reportDefinitionId: string | undefined,
    target: string,
  ): Promise<ReadinessAccumulator> {
    const readiness = this.createReadinessAccumulator();

    if (!reportDefinitionId) {
      this.addBlocker(
        readiness,
        'report_definition_id_missing',
        'reportDefinitionId is required.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'report_definition_id_present',
      'reportDefinitionId is configured.',
      target,
    );
    const reportDefinition = await this.findReportDefinition(tenantId, reportDefinitionId);

    if (!reportDefinition) {
      this.addBlocker(
        readiness,
        'report_definition_not_found',
        'Report definition was not found for this tenant.',
        target,
      );
      return readiness;
    }

    this.addCheck(
      readiness,
      'report_definition_found',
      'Report definition exists for this tenant.',
      target,
    );
    let resolvableReferencesCount = 0;

    if (reportDefinition.queryDefinitionId) {
      resolvableReferencesCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateQuery(
          tenantId,
          reportDefinition.queryDefinitionId,
          `${target}.queryDefinitionId`,
        ),
      );
    }

    if (reportDefinition.dashboardDefinitionId) {
      resolvableReferencesCount += 1;
      this.mergeReadiness(
        readiness,
        await this.evaluateDashboard(
          tenantId,
          reportDefinition.dashboardDefinitionId,
          `${target}.dashboardDefinitionId`,
        ),
      );
    }

    for (const block of reportDefinition.blocks) {
      const blockTarget = `${target}.blocks.${block.key}`;

      if (block.queryDefinitionId) {
        resolvableReferencesCount += 1;
        this.mergeReadiness(
          readiness,
          await this.evaluateQuery(tenantId, block.queryDefinitionId, blockTarget),
        );
        continue;
      }

      if (block.dashboardDefinitionId) {
        resolvableReferencesCount += 1;
        this.mergeReadiness(
          readiness,
          await this.evaluateDashboard(tenantId, block.dashboardDefinitionId, blockTarget),
        );
        continue;
      }

      this.addWarning(
        readiness,
        'report_block_reference_missing',
        'Report block has no query or dashboard reference.',
        blockTarget,
      );
    }

    if (Object.keys(reportDefinition.exportOptions).length > 0) {
      this.addCheck(
        readiness,
        'report_export_options_declarative',
        'Export options are declarative only and no file will be generated.',
        `${target}.exportOptions`,
      );
    }

    if (resolvableReferencesCount === 0) {
      this.addBlocker(
        readiness,
        'report_has_no_resolvable_reference',
        'Report has no queryDefinitionId or dashboardDefinitionId to validate declaratively.',
        target,
      );
    }

    return readiness;
  }

  private createReadinessAccumulator(): ReadinessAccumulator {
    return { checks: [], warnings: [], blockers: [] };
  }

  private mergeReadiness(target: ReadinessAccumulator, source: ReadinessAccumulator): void {
    target.checks.push(...source.checks);
    target.warnings.push(...source.warnings);
    target.blockers.push(...source.blockers);
  }

  private addCheck(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.checks.push({ code, message, target });
  }

  private addWarning(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.warnings.push({ code, message, target });
  }

  private addBlocker(
    readiness: ReadinessAccumulator,
    code: string,
    message: string,
    target?: string,
  ): void {
    readiness.blockers.push({ code, message, target });
  }

  private async findQueryDefinition(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<Awaited<ReturnType<QueryDefinitionsService['findOne']>> | null> {
    try {
      return await this.queryDefinitionsService.findOne(tenantId, queryDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findDataset(
    tenantId: string,
    datasetId: string,
  ): Promise<Awaited<ReturnType<DatasetsService['findOne']>> | null> {
    try {
      return await this.datasetsService.findOne(tenantId, datasetId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findDashboardDefinition(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<Awaited<ReturnType<DashboardDefinitionsService['findOne']>> | null> {
    try {
      return await this.dashboardDefinitionsService.findOne(tenantId, dashboardDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  private async findReportDefinition(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<Awaited<ReturnType<ReportDefinitionsService['findOne']>> | null> {
    try {
      return await this.reportDefinitionsService.findOne(tenantId, reportDefinitionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }
}
