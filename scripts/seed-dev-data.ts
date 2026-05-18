import { Types } from 'mongoose';

import {
  SemanticMeasureAggregation,
  SemanticDimensionDomain,
  SemanticCardinalityHint,
  SemanticType,
  SemanticModelStatus,
  SemanticQualityLevel,
} from '../src/modules/semantic-models/schemas/semantic-model.schema';
import {
  DashboardDefinitionChartType,
  DashboardDefinitionFilterOperator,
  DashboardDefinitionLayoutDensity,
  DashboardDefinitionLayoutGap,
  DashboardDefinitionLayoutType,
  DashboardDefinitionWidgetType,
} from '../src/modules/dashboard-definitions/schemas/dashboard-definition.schema';
import {
  DatasetFieldSemanticRole,
  DatasetFieldType,
} from '../src/modules/datasets/schemas/dataset.schema';
import {
  FieldMappingTargetType,
  FieldMappingTransform,
} from '../src/modules/field-mappings/schemas/field-mapping.schema';
import {
  QueryDefinitionAggregation,
  QueryDefinitionDimensionType,
  QueryDefinitionFilterOperator,
  QueryDefinitionSortDirection,
  QueryDefinitionTimeGranularity,
  QueryDefinitionType,
} from '../src/modules/query-definitions/schemas/query-definition.schema';
import {
  ReportDefinitionBlockType,
  ReportDefinitionFilterOperator,
  ReportDefinitionLayoutDensity,
  ReportDefinitionLayoutType,
  ReportDefinitionParameterType,
} from '../src/modules/report-definitions/schemas/report-definition.schema';

export const demoActorId = 'dev-demo-owner';
export const demoCredentialPlaceholder = 'not-a-real-secret-value';

export const demoSeedKeys = {
  tenantSlug: 'delfos-demo-local',
  ownerEmail: 'owner.demo@example.local',
  connectionName: 'Fonte Demo Local',
  credentialName: 'Credencial Demo Local',
  datasetKeys: ['sales_orders_demo', 'customers_demo', 'payments_demo'],
  queryKeys: ['sales_overview_demo', 'sales_by_day_demo', 'customers_summary_demo'],
  dashboardKeys: ['commercial_dashboard_demo'],
  reportKeys: ['monthly_sales_report_demo'],
  semanticModelKeys: ['commercial_demo'],
} as const;

export interface SeedDatasetInput {
  datasetKey: string;
  name: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: DatasetFieldType;
    required: boolean;
    semanticRole: DatasetFieldSemanticRole;
    description?: string;
  }>;
  primaryKeyFields: string[];
  timeField?: string;
  tags: string[];
  metadata: Record<string, string | boolean | number | null>;
}

export interface SeedFieldMappingInput {
  datasetKey: string;
  sourcePath: string;
  targetField: string;
  targetType: FieldMappingTargetType;
  required: boolean;
  transform?: FieldMappingTransform;
}

export interface SeedQueryInput {
  queryKey: string;
  datasetKey: string;
  name: string;
  description: string;
  type: QueryDefinitionType;
  metrics: Array<{
    key: string;
    label: string;
    field: string;
    aggregation: QueryDefinitionAggregation;
    format?: string;
    description?: string;
  }>;
  dimensions: Array<{
    key: string;
    label: string;
    field: string;
    type: QueryDefinitionDimensionType;
  }>;
  timeField?: string;
  tags: string[];
}

export interface SeedDashboardInput {
  dashboardKey: string;
  name: string;
  description: string;
  layout: {
    type: DashboardDefinitionLayoutType;
    columns: number;
    gap: DashboardDefinitionLayoutGap;
    density: DashboardDefinitionLayoutDensity;
  };
  sections: Array<{
    key: string;
    title: string;
    description: string;
    order: number;
    layout: { type: DashboardDefinitionLayoutType; columns: number };
  }>;
  widgets: Array<{
    key: string;
    title: string;
    description: string;
    type: DashboardDefinitionWidgetType;
    queryDefinitionId: Types.ObjectId;
    sectionKey: string;
    order: number;
    size: { cols: number; rows: number };
    position: { x: number; y: number };
    visualization: {
      chartType: DashboardDefinitionChartType;
      xField?: string;
      yFields?: string[];
      format?: string;
    };
    options: Record<string, boolean | string | number>;
  }>;
  filters: Array<{
    key: string;
    label: string;
    field: string;
    operator: DashboardDefinitionFilterOperator;
    required: boolean;
    defaultValue: string;
    allowedValues: string[];
  }>;
  tags: string[];
  metadata: Record<string, string | boolean>;
  settings: Record<string, boolean>;
}

export interface SeedReportInput {
  reportKey: string;
  name: string;
  description: string;
  queryDefinitionId: Types.ObjectId;
  dashboardDefinitionId: Types.ObjectId;
  layout: {
    type: ReportDefinitionLayoutType;
    columns: number;
    density: ReportDefinitionLayoutDensity;
  };
  sections: Array<{
    key: string;
    title: string;
    description: string;
    order: number;
    layout: { type: ReportDefinitionLayoutType; columns: number };
  }>;
  blocks: Array<{
    key: string;
    title: string;
    description: string;
    type: ReportDefinitionBlockType;
    queryDefinitionId?: Types.ObjectId;
    dashboardDefinitionId?: Types.ObjectId;
    sectionKey: string;
    order: number;
    options: Record<string, boolean | string | number>;
  }>;
  filters: Array<{
    key: string;
    label: string;
    field: string;
    operator: ReportDefinitionFilterOperator;
    required: boolean;
    defaultValue: string;
    allowedValues: string[];
  }>;
  parameters: Array<{
    key: string;
    label: string;
    type: ReportDefinitionParameterType;
    required: boolean;
    defaultValue: string;
    allowedValues: string[];
  }>;
  exportOptions: Record<string, boolean | string | number>;
  tags: string[];
  metadata: Record<string, string | boolean>;
  settings: Record<string, boolean>;
}

export type { SeedPreviewCommandContext } from './seed-dev-commands';
export {
  buildDelfosWebCommand,
  buildListQueryDefinitionsCommand,
  buildPreviewQueryDefinitionCommand,
  buildListDashboardDefinitionsCommand,
  buildPreviewDashboardDefinitionCommand,
} from './seed-dev-commands';

export function buildDatasetInputs(): SeedDatasetInput[] {
  return [
    {
      datasetKey: 'sales_orders_demo',
      name: 'Pedidos Demo',
      description: 'Dataset declarativo ficticio para pedidos de venda demo.',
      fields: [
        field('orderId', 'Pedido demo', DatasetFieldType.String, true, 'identifier'),
        field('saleDate', 'Data demo', DatasetFieldType.Date, true, 'timestamp'),
        field('totalAmount', 'Valor demo', DatasetFieldType.Currency, true, 'metric'),
        field('status', 'Status demo', DatasetFieldType.String, false, 'dimension'),
      ],
      primaryKeyFields: ['orderId'],
      timeField: 'saleDate',
      tags: ['demo', 'sales', 'orders'],
      metadata: { domain: 'sales-demo', devSeed: true },
    },
    {
      datasetKey: 'customers_demo',
      name: 'Clientes Demo',
      description: 'Dataset declarativo ficticio para clientes demo.',
      fields: [
        field('customerId', 'Cliente demo', DatasetFieldType.String, true, 'identifier'),
        field('customerSegment', 'Segmento demo', DatasetFieldType.String, false, 'dimension'),
        field('customerCount', 'Quantidade demo', DatasetFieldType.Number, false, 'metric'),
      ],
      primaryKeyFields: ['customerId'],
      tags: ['demo', 'customers'],
      metadata: { domain: 'customers-demo', devSeed: true },
    },
    {
      datasetKey: 'payments_demo',
      name: 'Pagamentos Demo',
      description: 'Dataset declarativo ficticio para pagamentos demo.',
      fields: [
        field('paymentId', 'Pagamento demo', DatasetFieldType.String, true, 'identifier'),
        field('paidAt', 'Data de pagamento demo', DatasetFieldType.Date, true, 'timestamp'),
        field('paidAmount', 'Valor pago demo', DatasetFieldType.Currency, true, 'metric'),
      ],
      primaryKeyFields: ['paymentId'],
      timeField: 'paidAt',
      tags: ['demo', 'payments'],
      metadata: { domain: 'payments-demo', devSeed: true },
    },
  ];
}

export function buildFieldMappingInputs(): SeedFieldMappingInput[] {
  return [
    mapping('sales_orders_demo', 'demo_order.id', 'orderId', 'string', true),
    mapping(
      'sales_orders_demo',
      'demo_order.created_at',
      'saleDate',
      'date',
      true,
      'string_to_date',
    ),
    mapping(
      'sales_orders_demo',
      'demo_order.amount',
      'totalAmount',
      'money',
      true,
      'number_to_money',
    ),
    mapping('sales_orders_demo', 'demo_order.status', 'status', 'string', false),
    mapping('customers_demo', 'demo_customer.id', 'customerId', 'string', true),
    mapping('customers_demo', 'demo_customer.segment', 'customerSegment', 'string', false),
    mapping('customers_demo', 'demo_customer.count', 'customerCount', 'integer', false),
    mapping('payments_demo', 'demo_payment.id', 'paymentId', 'string', true),
    mapping('payments_demo', 'demo_payment.paid_at', 'paidAt', 'date', true, 'string_to_date'),
    mapping('payments_demo', 'demo_payment.amount', 'paidAmount', 'money', true, 'number_to_money'),
  ];
}

export function buildQueryInputs(): SeedQueryInput[] {
  return [
    {
      queryKey: 'sales_overview_demo',
      datasetKey: 'sales_orders_demo',
      name: 'Visao geral de vendas demo',
      description: 'Definicao logica ficticia para KPIs comerciais locais.',
      type: QueryDefinitionType.Metric,
      metrics: [
        metric('total_sales_demo', 'Vendas demo', 'totalAmount', 'sum', 'currency'),
        metric('orders_demo', 'Pedidos demo', 'orderId', 'count', 'integer'),
      ],
      dimensions: [dimension('status_demo', 'Status demo', 'status', 'string')],
      timeField: 'saleDate',
      tags: ['demo', 'sales', 'overview'],
    },
    {
      queryKey: 'sales_by_day_demo',
      datasetKey: 'sales_orders_demo',
      name: 'Vendas por dia demo',
      description: 'Definicao logica ficticia para serie temporal local.',
      type: QueryDefinitionType.Timeseries,
      metrics: [metric('total_sales_demo', 'Vendas demo', 'totalAmount', 'sum', 'currency')],
      dimensions: [dimension('sale_day_demo', 'Dia demo', 'saleDate', 'date')],
      timeField: 'saleDate',
      tags: ['demo', 'sales', 'timeseries'],
    },
    {
      queryKey: 'customers_summary_demo',
      datasetKey: 'customers_demo',
      name: 'Resumo de clientes demo',
      description: 'Definicao logica ficticia para agrupamento de clientes locais.',
      type: QueryDefinitionType.Table,
      metrics: [metric('customers_demo', 'Clientes demo', 'customerCount', 'sum', 'integer')],
      dimensions: [dimension('segment_demo', 'Segmento demo', 'customerSegment', 'string')],
      tags: ['demo', 'customers', 'summary'],
    },
  ];
}

export function buildDashboardInput(queryIds: {
  salesOverview: Types.ObjectId;
  salesByDay: Types.ObjectId;
  customersSummary: Types.ObjectId;
}): SeedDashboardInput {
  return {
    dashboardKey: 'commercial_dashboard_demo',
    name: 'Dashboard Comercial Demo',
    description: 'Painel declarativo com dados ficticios para validacao local.',
    layout: {
      type: DashboardDefinitionLayoutType.Grid,
      columns: 12,
      gap: DashboardDefinitionLayoutGap.Md,
      density: DashboardDefinitionLayoutDensity.Comfortable,
    },
    sections: [
      {
        key: 'overview',
        title: 'Visao geral demo',
        description: 'Indicadores ficticios para ambiente local.',
        order: 1,
        layout: { type: DashboardDefinitionLayoutType.Grid, columns: 12 },
      },
    ],
    widgets: [
      widget('demo_total_sales', 'Vendas demo', 'Indicador ficticio sem execucao de query.', {
        type: DashboardDefinitionWidgetType.MetricCard,
        queryDefinitionId: queryIds.salesOverview,
        order: 1,
        size: { cols: 3, rows: 1 },
        position: { x: 0, y: 0 },
        chartType: DashboardDefinitionChartType.Number,
        format: 'currency',
        options: { showTrend: true },
      }),
      widget('demo_sales_by_day', 'Vendas por dia demo', 'Grafico declarativo ficticio.', {
        type: DashboardDefinitionWidgetType.Chart,
        queryDefinitionId: queryIds.salesByDay,
        order: 2,
        size: { cols: 6, rows: 2 },
        position: { x: 3, y: 0 },
        chartType: DashboardDefinitionChartType.Bar,
        xField: 'saleDate',
        yFields: ['totalAmount'],
        format: 'currency',
        options: { stacked: false },
      }),
      widget('demo_customers_summary', 'Clientes demo', 'Resumo de clientes ficticios.', {
        type: DashboardDefinitionWidgetType.Table,
        queryDefinitionId: queryIds.customersSummary,
        order: 3,
        size: { cols: 3, rows: 2 },
        position: { x: 9, y: 0 },
        chartType: DashboardDefinitionChartType.Table,
        yFields: ['customerCount'],
        options: { compact: true },
      }),
    ],
    filters: [
      {
        key: 'period',
        label: 'Periodo demo',
        field: 'saleDate',
        operator: DashboardDefinitionFilterOperator.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_7_days', 'last_30_days', 'this_month'],
      },
    ],
    tags: ['demo', 'commercial', 'local'],
    metadata: { domain: 'commercial-demo', devSeed: true },
    settings: { visibleInBuilder: true },
  };
}

export function buildReportInput(ids: {
  salesOverview: Types.ObjectId;
  commercialDashboard: Types.ObjectId;
}): SeedReportInput {
  return {
    reportKey: 'monthly_sales_report_demo',
    name: 'Relatorio Mensal de Vendas Demo',
    description:
      'Relatorio declarativo ficticio para validacao local, sem geracao real de arquivo.',
    queryDefinitionId: ids.salesOverview,
    dashboardDefinitionId: ids.commercialDashboard,
    layout: {
      type: ReportDefinitionLayoutType.Paged,
      columns: 12,
      density: ReportDefinitionLayoutDensity.Comfortable,
    },
    sections: [
      {
        key: 'summary',
        title: 'Resumo demo',
        description: 'Secao declarativa com configuracao ficticia.',
        order: 1,
        layout: { type: ReportDefinitionLayoutType.Sections, columns: 12 },
      },
    ],
    blocks: [
      {
        key: 'sales_summary_table',
        title: 'Tabela comercial demo',
        description: 'Bloco declarativo ligado a query definition demo.',
        type: ReportDefinitionBlockType.Table,
        queryDefinitionId: ids.salesOverview,
        sectionKey: 'summary',
        order: 1,
        options: { showTotals: true, format: 'currency' },
      },
      {
        key: 'dashboard_reference',
        title: 'Referencia de dashboard demo',
        description: 'Referencia declarativa ao dashboard demo, sem renderizacao real.',
        type: ReportDefinitionBlockType.DashboardWidget,
        dashboardDefinitionId: ids.commercialDashboard,
        sectionKey: 'summary',
        order: 2,
        options: { includeSnapshotPlaceholder: false },
      },
    ],
    filters: [
      {
        key: 'period',
        label: 'Periodo demo',
        field: 'saleDate',
        operator: ReportDefinitionFilterOperator.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_7_days', 'last_30_days', 'this_month'],
      },
    ],
    parameters: [
      {
        key: 'report_period',
        label: 'Periodo do relatorio demo',
        type: ReportDefinitionParameterType.DateRange,
        required: true,
        defaultValue: 'last_30_days',
        allowedValues: ['last_7_days', 'last_30_days', 'this_month'],
      },
    ],
    exportOptions: {
      defaultFormat: 'pdf',
      includeFilters: true,
      declarativeOnly: true,
    },
    tags: ['demo', 'reports', 'sales'],
    metadata: { domain: 'reports-demo', devSeed: true },
    settings: { visibleInBuilder: true },
  };
}

function field(
  key: string,
  label: string,
  type: DatasetFieldType,
  required: boolean,
  semanticRole: `${DatasetFieldSemanticRole}`,
): SeedDatasetInput['fields'][number] {
  return { key, label, type, required, semanticRole: semanticRole as DatasetFieldSemanticRole };
}

function metric(
  key: string,
  label: string,
  fieldName: string,
  aggregation: `${QueryDefinitionAggregation}`,
  format?: string,
): SeedQueryInput['metrics'][number] {
  return {
    key,
    label,
    field: fieldName,
    aggregation: aggregation as QueryDefinitionAggregation,
    format,
  };
}

function dimension(
  key: string,
  label: string,
  fieldName: string,
  type: `${QueryDefinitionDimensionType}`,
): SeedQueryInput['dimensions'][number] {
  return { key, label, field: fieldName, type: type as QueryDefinitionDimensionType };
}

function mapping(
  datasetKey: string,
  sourcePath: string,
  targetField: string,
  targetType: `${FieldMappingTargetType}`,
  required: boolean,
  transform?: `${FieldMappingTransform}`,
): SeedFieldMappingInput {
  return {
    datasetKey,
    sourcePath,
    targetField,
    targetType: targetType as FieldMappingTargetType,
    required,
    transform: transform as FieldMappingTransform | undefined,
  };
}

function widget(
  key: string,
  title: string,
  description: string,
  input: {
    type: DashboardDefinitionWidgetType;
    queryDefinitionId: Types.ObjectId;
    order: number;
    size: { cols: number; rows: number };
    position: { x: number; y: number };
    chartType: DashboardDefinitionChartType;
    xField?: string;
    yFields?: string[];
    format?: string;
    options: Record<string, boolean | string | number>;
  },
): SeedDashboardInput['widgets'][number] {
  return {
    key,
    title,
    description,
    type: input.type,
    queryDefinitionId: input.queryDefinitionId,
    sectionKey: 'overview',
    order: input.order,
    size: input.size,
    position: input.position,
    visualization: {
      chartType: input.chartType,
      xField: input.xField,
      yFields: input.yFields,
      format: input.format,
    },
    options: input.options,
  };
}

export function buildSeedIdentityKeys(): string[] {
  return [
    demoSeedKeys.tenantSlug,
    demoSeedKeys.ownerEmail,
    demoSeedKeys.connectionName,
    demoSeedKeys.credentialName,
    ...demoSeedKeys.datasetKeys,
    ...demoSeedKeys.queryKeys,
    ...demoSeedKeys.dashboardKeys,
    ...demoSeedKeys.reportKeys,
    ...demoSeedKeys.semanticModelKeys,
  ];
}

export function buildQueryFilter(timeField?: string): {
  key: string;
  label: string;
  field: string;
  operator: QueryDefinitionFilterOperator;
  required: boolean;
  defaultValue: string;
  allowedValues: string[];
} {
  return {
    key: 'period',
    label: 'Periodo demo',
    field: timeField ?? 'created_at',
    operator: QueryDefinitionFilterOperator.DateRange,
    required: true,
    defaultValue: 'last_30_days',
    allowedValues: ['last_7_days', 'last_30_days', 'this_month'],
  };
}

export function buildQuerySorts(timeField?: string): Array<{
  field: string;
  direction: QueryDefinitionSortDirection;
}> {
  return timeField ? [{ field: timeField, direction: QueryDefinitionSortDirection.Desc }] : [];
}

export const demoAllowedGranularities = [
  QueryDefinitionTimeGranularity.Day,
  QueryDefinitionTimeGranularity.Month,
];

export interface SemanticModelSeedInput {
  modelKey: string;
  name: string;
  description: string;
  status: SemanticModelStatus;
  datasetKeys: string[];
  tags: string[];
  quality: { score: number; level: SemanticQualityLevel; warnings: string[] };
  measures: Array<{ key: string } & Record<string, unknown>>;
  dimensions: Array<{ key: string } & Record<string, unknown>>;
  glossaryTerms: Array<{ key: string } & Record<string, unknown>>;
}

/**
 * Declarative demo semantic model. Metadata-only: no measure is evaluated,
 * no dimension is queried, no glossary term activates AI. Mirrors ADR-0034.
 */
export function buildSemanticModelInputs(): SemanticModelSeedInput[] {
  return [
    {
      modelKey: 'commercial_demo',
      name: 'Comercial Demo',
      description:
        'Modelo semantico declarativo para analises comerciais demonstrativas.',
      status: SemanticModelStatus.Review,
      datasetKeys: ['sales_orders_demo', 'customers_demo', 'payments_demo'],
      tags: ['demo', 'comercial'],
      quality: {
        score: 72,
        level: SemanticQualityLevel.Good,
        warnings: ['Modelo demonstrativo — revisar antes de uso real.'],
      },
      measures: [
        {
          key: 'faturamento',
          name: 'Faturamento',
          description: 'Soma declarativa do valor faturado. Nada e calculado.',
          aggregation: SemanticMeasureAggregation.Sum,
          semanticType: SemanticType.Currency,
          datasetKey: 'sales_orders_demo',
          fieldKey: 'totalAmount',
          unit: 'BRL',
          formatHint: 'currency',
          status: SemanticModelStatus.Review,
          tags: ['comercial'],
          isReusable: true,
          warnings: [],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
        {
          key: 'ticket_medio',
          name: 'Ticket medio',
          description: 'Media declarativa do valor por pedido. Nada e calculado.',
          aggregation: SemanticMeasureAggregation.Avg,
          semanticType: SemanticType.Currency,
          datasetKey: 'sales_orders_demo',
          fieldKey: 'totalAmount',
          unit: 'BRL',
          formatHint: 'currency',
          status: SemanticModelStatus.Review,
          tags: ['comercial'],
          isReusable: true,
          warnings: [],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
        {
          key: 'pedidos',
          name: 'Pedidos',
          description: 'Contagem declarativa de pedidos. Nada e calculado.',
          aggregation: SemanticMeasureAggregation.Count,
          semanticType: SemanticType.Quantity,
          datasetKey: 'sales_orders_demo',
          fieldKey: 'orderId',
          status: SemanticModelStatus.Review,
          tags: ['comercial'],
          isReusable: true,
          warnings: [],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
      ],
      dimensions: [
        {
          key: 'cidade',
          name: 'Cidade',
          description: 'Recorte declarativo por cidade.',
          semanticType: SemanticType.City,
          domain: SemanticDimensionDomain.Geography,
          datasetKey: 'customers_demo',
          cardinalityHint: SemanticCardinalityHint.Medium,
          status: SemanticModelStatus.Review,
          tags: ['geografia'],
          warnings: [],
          metadata: { domain: 'geography-demo', devSeed: true },
        },
        {
          key: 'categoria',
          name: 'Categoria',
          description: 'Recorte declarativo por categoria de produto.',
          semanticType: SemanticType.Category,
          domain: SemanticDimensionDomain.Product,
          datasetKey: 'sales_orders_demo',
          cardinalityHint: SemanticCardinalityHint.Medium,
          status: SemanticModelStatus.Review,
          tags: ['produto'],
          warnings: [],
          metadata: { domain: 'product-demo', devSeed: true },
        },
        {
          key: 'periodo',
          name: 'Periodo',
          description: 'Recorte declarativo temporal.',
          semanticType: SemanticType.Date,
          domain: SemanticDimensionDomain.Time,
          datasetKey: 'sales_orders_demo',
          cardinalityHint: SemanticCardinalityHint.High,
          status: SemanticModelStatus.Review,
          tags: ['tempo'],
          warnings: [],
          metadata: { domain: 'time-demo', devSeed: true },
        },
      ],
      glossaryTerms: [
        {
          key: 'faturamento',
          name: 'Faturamento',
          description:
            'Termo de negocio declarativo. Sem regra executavel ou IA.',
          aliases: ['receita'],
          domain: SemanticDimensionDomain.Financial,
          relatedMeasureKeys: ['faturamento'],
          relatedDimensionKeys: [],
          status: SemanticModelStatus.Review,
          tags: ['glossario'],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
        {
          key: 'ticket_medio',
          name: 'Ticket medio',
          description: 'Termo de negocio declarativo. Sem calculo real.',
          aliases: ['valor medio do pedido'],
          domain: SemanticDimensionDomain.Financial,
          relatedMeasureKeys: ['ticket_medio'],
          relatedDimensionKeys: [],
          status: SemanticModelStatus.Review,
          tags: ['glossario'],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
        {
          key: 'cliente_ativo',
          name: 'Cliente ativo',
          description: 'Termo de negocio declarativo. Sem regra executavel.',
          aliases: ['conta ativa'],
          domain: SemanticDimensionDomain.Customer,
          relatedMeasureKeys: [],
          relatedDimensionKeys: ['cidade'],
          status: SemanticModelStatus.Review,
          tags: ['glossario'],
          metadata: { domain: 'customer-demo', devSeed: true },
        },
        {
          key: 'pedido_cancelado',
          name: 'Pedido cancelado',
          description: 'Termo de negocio declarativo. Sem regra executavel.',
          aliases: [],
          domain: SemanticDimensionDomain.Operational,
          relatedMeasureKeys: ['pedidos'],
          relatedDimensionKeys: [],
          status: SemanticModelStatus.Review,
          tags: ['glossario'],
          metadata: { domain: 'sales-demo', devSeed: true },
        },
      ],
    },
  ];
}
