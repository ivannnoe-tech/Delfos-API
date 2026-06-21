import { randomUUID } from 'node:crypto';

import {
  buildDashboardInput,
  buildDatasetInputs,
  buildDelfosWebCommand,
  buildFieldMappingInputs,
  buildListDashboardDefinitionsCommand,
  buildListQueryDefinitionsCommand,
  buildPreviewDashboardDefinitionCommand,
  buildPreviewQueryDefinitionCommand,
  buildQueryInputs,
  buildReportInput,
  buildSemanticModelInputs,
  buildSeedIdentityKeys,
  demoSeedKeys,
} from './seed-dev-data';

describe('seed-dev data', () => {
  it('uses stable unique keys for idempotent upserts', () => {
    const keys = buildSeedIdentityKeys();

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        demoSeedKeys.tenantSlug,
        demoSeedKeys.ownerEmail,
        ...demoSeedKeys.datasetKeys,
        ...demoSeedKeys.queryKeys,
        ...demoSeedKeys.dashboardKeys,
        ...demoSeedKeys.reportKeys,
      ]),
    );
  });

  it('creates the expected fictitious foundation catalog keys', () => {
    expect(buildDatasetInputs().map((dataset) => dataset.datasetKey)).toEqual([
      'sales_orders_demo',
      'customers_demo',
      'payments_demo',
    ]);
    expect(buildQueryInputs().map((query) => query.queryKey)).toEqual([
      'sales_overview_demo',
      'sales_by_day_demo',
      'customers_summary_demo',
    ]);

    const dashboard = buildDashboardInput({
      salesOverview: randomUUID(),
      salesByDay: randomUUID(),
      customersSummary: randomUUID(),
    });

    expect(dashboard.dashboardKey).toBe('commercial_dashboard_demo');
    expect(dashboard.widgets).toHaveLength(3);

    const report = buildReportInput({
      salesOverview: randomUUID(),
      commercialDashboard: randomUUID(),
    });

    expect(report.reportKey).toBe('monthly_sales_report_demo');
    expect(report.blocks).toHaveLength(2);
    expect(report.exportOptions).toMatchObject({ declarativeOnly: true });
  });

  it('keeps demo fixtures free of real-looking secrets', () => {
    const serializedFixtures = JSON.stringify({
      datasets: buildDatasetInputs(),
      fieldMappings: buildFieldMappingInputs(),
      queries: buildQueryInputs(),
      dashboard: buildDashboardInput({
        salesOverview: '662d4f6e7a1c2b00124f0601',
        salesByDay: '662d4f6e7a1c2b00124f0602',
        customersSummary: '662d4f6e7a1c2b00124f0603',
      }),
      report: buildReportInput({
        salesOverview: '662d4f6e7a1c2b00124f0601',
        commercialDashboard: '662d4f6e7a1c2b00124f0701',
      }),
    }).toLowerCase();

    expect(serializedFixtures).not.toContain('authorization');
    expect(serializedFixtures).not.toContain('password');
    expect(serializedFixtures).not.toContain('privatekey');
    expect(serializedFixtures).not.toContain('apikey');
    expect(serializedFixtures).not.toContain('secret');
  });

  it('prints a delfos-web command without expanding the admin key value', () => {
    const command = buildDelfosWebCommand('662d4f6e7a1c2b00124f0001', '662d4f6e7a1c2b00124f0101');

    expect(command).toContain('--dart-define=DELFOS_TENANT_ID=662d4f6e7a1c2b00124f0001');
    expect(command).toContain('--dart-define=DELFOS_ACTOR_ID=662d4f6e7a1c2b00124f0101');
    expect(command).toContain('--dart-define=DELFOS_ADMIN_KEY=$env:DELFOS_ADMIN_KEY');
    expect(command).not.toContain('change-me-local-admin-key');
  });

  it('declares a unique semantic model demo key', () => {
    expect(demoSeedKeys.semanticModelKeys).toEqual(['commercial_demo']);
    const keys = buildSeedIdentityKeys();
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(expect.arrayContaining([...demoSeedKeys.semanticModelKeys]));
  });

  it('prints preview test commands without expanding the admin key value', () => {
    const tenantId = '662d4f6e7a1c2b00124f0001';
    const actorId = '662d4f6e7a1c2b00124f0101';
    const queryDefinitionId = '662d4f6e7a1c2b00124f0201';
    const dashboardDefinitionId = '662d4f6e7a1c2b00124f0301';
    const commands = [
      buildListQueryDefinitionsCommand(tenantId, actorId),
      buildPreviewQueryDefinitionCommand({
        tenantId,
        actorId,
        queryDefinitionId,
        dashboardDefinitionId,
      }),
      buildListDashboardDefinitionsCommand(tenantId, actorId),
      buildPreviewDashboardDefinitionCommand({
        tenantId,
        actorId,
        queryDefinitionId,
        dashboardDefinitionId,
      }),
    ];
    const output = commands.join('\n');

    expect(output).toContain('$env:DELFOS_ADMIN_KEY');
    expect(output).toContain(`"x-delfos-tenant-id" = "${tenantId}"`);
    expect(output).toContain(`"x-delfos-actor-id" = "${actorId}"`);
    expect(output).toContain(`/api/v1/query-definitions?tenantId=${tenantId}`);
    expect(output).toContain(
      `/api/v1/query-definitions/${queryDefinitionId}/preview?tenantId=${tenantId}`,
    );
    expect(output).toContain(`/api/v1/dashboard-definitions?tenantId=${tenantId}`);
    expect(output).toContain(
      `/api/v1/dashboard-definitions/${dashboardDefinitionId}/preview?tenantId=${tenantId}`,
    );
    expect(output).toContain('-Body \'{"rowLimit":5}\'');
    expect(output).toContain('-Body \'{"rowLimitPerWidget":5}\'');
    expect(output).not.toContain('change-me-local-admin-key');
    expect(output).not.toContain('not-a-real-secret-value');
  });

  it('builds a declarative commercial demo semantic model', () => {
    const models = buildSemanticModelInputs();
    expect(models).toHaveLength(1);
    const model = models[0];
    expect(model.modelKey).toBe('commercial_demo');
    expect(model.measures.map((m) => m.key)).toEqual(['faturamento', 'ticket_medio', 'pedidos']);
    expect(model.dimensions.map((d) => d.key)).toEqual(['cidade', 'categoria', 'periodo']);
    expect(model.glossaryTerms.map((g) => g.key)).toEqual([
      'faturamento',
      'ticket_medio',
      'cliente_ativo',
      'pedido_cancelado',
    ]);
    for (const coll of [model.measures, model.dimensions, model.glossaryTerms]) {
      const keys = coll.map((i: { key: string }) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(JSON.stringify(model)).not.toMatch(/token|secret|password|bearer/i);
  });
});
