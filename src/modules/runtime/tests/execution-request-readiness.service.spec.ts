import { NotFoundException } from '@nestjs/common';

import { DashboardDefinitionsService } from '../../dashboard-definitions/services/dashboard-definitions.service';
import { DatasetStatus } from '../../datasets/schemas/dataset.schema';
import { DatasetsService } from '../../datasets/services/datasets.service';
import { FieldMappingStatus } from '../../field-mappings/schemas/field-mapping.schema';
import { FieldMappingsService } from '../../field-mappings/services/field-mappings.service';
import { QueryDefinitionStatus } from '../../query-definitions/schemas/query-definition.schema';
import { QueryDefinitionsService } from '../../query-definitions/services/query-definitions.service';
import { ReportDefinitionsService } from '../../report-definitions/services/report-definitions.service';
import { ExecutionRequestKind } from '../schemas/execution-request.schema';
import {
  ExecutionRequestReadinessService,
  ReadinessAccumulator,
} from '../services/execution-request-readiness.service';
import { createRuntimeRequestFixture, newId } from './execution-request-test-fixtures';

type QueryDef = Awaited<ReturnType<QueryDefinitionsService['findOne']>>;
type DatasetDef = Awaited<ReturnType<DatasetsService['findOne']>>;
type DashboardDef = Awaited<ReturnType<DashboardDefinitionsService['findOne']>>;
type ReportDef = Awaited<ReturnType<ReportDefinitionsService['findOne']>>;
type FieldMappingItem = Awaited<ReturnType<FieldMappingsService['findByFilters']>>['items'][number];

const DATASET_ID = '662d4f6e7a1c2b00124f0501';

function queryDef(overrides: Partial<QueryDef> = {}): QueryDef {
  return {
    status: QueryDefinitionStatus.Active,
    datasetId: DATASET_ID,
    metadata: {},
    ...overrides,
  } as unknown as QueryDef;
}

function datasetDef(overrides: Partial<DatasetDef> = {}): DatasetDef {
  return {
    status: DatasetStatus.Active,
    datasetKey: 'sales_orders',
    metadata: {},
    ...overrides,
  } as unknown as DatasetDef;
}

function reportDef(overrides: Partial<ReportDef> = {}): ReportDef {
  return {
    queryDefinitionId: '662d4f6e7a1c2b00124f0601',
    dashboardDefinitionId: undefined,
    blocks: [],
    exportOptions: {},
    ...overrides,
  } as unknown as ReportDef;
}

function fieldMapping(status: FieldMappingStatus = FieldMappingStatus.Active): FieldMappingItem {
  return { status } as unknown as FieldMappingItem;
}

interface HarnessOptions {
  queryDefinition?: QueryDef;
  dataset?: DatasetDef;
  fieldMappings?: FieldMappingItem[];
  dashboardDefinition?: DashboardDef;
  reportDefinition?: ReportDef;
  queryFindError?: Error;
}

function createHarness(options: HarnessOptions) {
  const queryDefinitionsService = {
    findOne: jest.fn(async () => {
      if (options.queryFindError) {
        throw options.queryFindError;
      }
      if (!options.queryDefinition) {
        throw new NotFoundException('Query definition not found.');
      }
      return options.queryDefinition;
    }),
  };
  const datasetsService = {
    findOne: jest.fn(async () => {
      if (!options.dataset) {
        throw new NotFoundException('Dataset not found.');
      }
      return options.dataset;
    }),
  };
  const dashboardDefinitionsService = {
    findOne: jest.fn(async () => {
      if (!options.dashboardDefinition) {
        throw new NotFoundException('Dashboard definition not found.');
      }
      return options.dashboardDefinition;
    }),
  };
  const reportDefinitionsService = {
    findOne: jest.fn(async () => {
      if (!options.reportDefinition) {
        throw new NotFoundException('Report definition not found.');
      }
      return options.reportDefinition;
    }),
  };
  const fieldMappingsService = {
    findByFilters: jest.fn(async () => ({
      items: options.fieldMappings ?? [],
      meta: {
        page: 1,
        pageSize: 1000,
        total: options.fieldMappings?.length ?? 0,
        totalPages: options.fieldMappings && options.fieldMappings.length > 0 ? 1 : 0,
      },
    })),
  };
  const service = new ExecutionRequestReadinessService(
    queryDefinitionsService as unknown as QueryDefinitionsService,
    dashboardDefinitionsService as unknown as DashboardDefinitionsService,
    reportDefinitionsService as unknown as ReportDefinitionsService,
    datasetsService as unknown as DatasetsService,
    fieldMappingsService as unknown as FieldMappingsService,
  );

  return {
    service,
    queryDefinitionsService,
    datasetsService,
    dashboardDefinitionsService,
    reportDefinitionsService,
    fieldMappingsService,
  };
}

function codes(items: ReadinessAccumulator['checks']): string[] {
  return items.map((item) => item.code);
}

describe('ExecutionRequestReadinessService', () => {
  it('warns when the query definition status is not active', async () => {
    const harness = createHarness({
      queryDefinition: queryDef({ status: QueryDefinitionStatus.Archived }),
      dataset: datasetDef(),
      fieldMappings: [fieldMapping()],
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query }),
    );

    expect(codes(readiness.warnings)).toContain('query_definition_not_active');
    expect(readiness.blockers).toEqual([]);
  });

  it('warns when the dataset status is not active', async () => {
    const harness = createHarness({
      queryDefinition: queryDef(),
      dataset: datasetDef({ status: DatasetStatus.Inactive }),
      fieldMappings: [fieldMapping()],
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query }),
    );

    expect(codes(readiness.warnings)).toContain('dataset_not_active');
  });

  it('blocks when the dataset has no dataset key for field mappings', async () => {
    const harness = createHarness({
      queryDefinition: queryDef(),
      dataset: datasetDef({ datasetKey: undefined as unknown as string }),
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query }),
    );

    expect(codes(readiness.blockers)).toContain('dataset_key_missing');
  });

  it('never copies query or dataset metadata into the readiness output', async () => {
    const harness = createHarness({
      queryDefinition: queryDef({ metadata: { apiKey: 'must-not-leak-secret' } }),
      dataset: datasetDef({ metadata: { token: 'must-not-leak-secret' } }),
      fieldMappings: [fieldMapping()],
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query }),
    );

    expect(JSON.stringify(readiness)).not.toContain('must-not-leak-secret');
    for (const item of [...readiness.checks, ...readiness.warnings, ...readiness.blockers]) {
      expect(Object.keys(item).sort()).toEqual(['code', 'message', 'target']);
    }
  });

  it('keeps every declarative lookup scoped to the request tenant', async () => {
    const tenantId = newId();
    const queryDefinitionId = newId();
    const harness = createHarness({
      queryDefinition: queryDef(),
      dataset: datasetDef(),
      fieldMappings: [fieldMapping()],
    });

    await harness.service.evaluate(
      createRuntimeRequestFixture({
        tenantId,
        queryDefinitionId,
        kind: ExecutionRequestKind.Query,
      }),
    );

    expect(harness.queryDefinitionsService.findOne).toHaveBeenCalledWith(
      tenantId,
      queryDefinitionId,
    );
    expect(harness.datasetsService.findOne).toHaveBeenCalledWith(tenantId, DATASET_ID);
    expect(harness.fieldMappingsService.findByFilters).toHaveBeenCalledWith({
      tenantId,
      datasetKey: 'sales_orders',
      page: 1,
      pageSize: 1000,
    });
  });

  it('blocks when the dashboard definition id is missing', async () => {
    const harness = createHarness({});

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Dashboard,
        dashboardDefinitionId: undefined,
      }),
    );

    expect(codes(readiness.blockers)).toContain('dashboard_definition_id_missing');
    expect(harness.dashboardDefinitionsService.findOne).not.toHaveBeenCalled();
  });

  it('blocks when the dashboard definition does not exist for the tenant', async () => {
    const harness = createHarness({});

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Dashboard,
        dashboardDefinitionId: newId(),
      }),
    );

    expect(codes(readiness.blockers)).toContain('dashboard_definition_not_found');
  });

  it('blocks when the report definition id is missing', async () => {
    const harness = createHarness({});

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Report,
        reportDefinitionId: undefined,
      }),
    );

    expect(codes(readiness.blockers)).toContain('report_definition_id_missing');
  });

  it('blocks when the report definition does not exist for the tenant', async () => {
    const harness = createHarness({});

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Report,
        reportDefinitionId: newId(),
      }),
    );

    expect(codes(readiness.blockers)).toContain('report_definition_not_found');
  });

  it('warns and blocks when a report block has no query or dashboard reference', async () => {
    const harness = createHarness({
      reportDefinition: reportDef({
        queryDefinitionId: undefined,
        dashboardDefinitionId: undefined,
        blocks: [{ key: 'summary' }] as unknown as ReportDef['blocks'],
      }),
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Report,
        reportDefinitionId: newId(),
      }),
    );

    expect(codes(readiness.warnings)).toContain('report_block_reference_missing');
    expect(codes(readiness.blockers)).toContain('report_has_no_resolvable_reference');
  });

  it('resolves a report block-level query reference declaratively', async () => {
    const harness = createHarness({
      reportDefinition: reportDef({
        queryDefinitionId: undefined,
        dashboardDefinitionId: undefined,
        blocks: [
          { key: 'sales', queryDefinitionId: '662d4f6e7a1c2b00124f0601' },
        ] as unknown as ReportDef['blocks'],
      }),
      queryDefinition: queryDef(),
      dataset: datasetDef(),
      fieldMappings: [fieldMapping()],
    });

    const readiness = await harness.service.evaluate(
      createRuntimeRequestFixture({
        kind: ExecutionRequestKind.Report,
        reportDefinitionId: newId(),
      }),
    );

    expect(codes(readiness.checks)).toContain('query_definition_found');
    expect(codes(readiness.blockers)).not.toContain('report_has_no_resolvable_reference');
  });

  it('rethrows unexpected errors from a declarative lookup instead of swallowing them', async () => {
    const harness = createHarness({ queryFindError: new Error('datastore unavailable') });

    await expect(
      harness.service.evaluate(createRuntimeRequestFixture({ kind: ExecutionRequestKind.Query })),
    ).rejects.toThrow('datastore unavailable');
  });
});
