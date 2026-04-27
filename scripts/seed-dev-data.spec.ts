import { Types } from 'mongoose';

import {
  buildDashboardInput,
  buildDatasetInputs,
  buildDelfosWebCommand,
  buildFieldMappingInputs,
  buildQueryInputs,
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
      salesOverview: new Types.ObjectId(),
      salesByDay: new Types.ObjectId(),
      customersSummary: new Types.ObjectId(),
    });

    expect(dashboard.dashboardKey).toBe('commercial_dashboard_demo');
    expect(dashboard.widgets).toHaveLength(3);
  });

  it('keeps demo fixtures free of real-looking secrets', () => {
    const serializedFixtures = JSON.stringify({
      datasets: buildDatasetInputs(),
      fieldMappings: buildFieldMappingInputs(),
      queries: buildQueryInputs(),
      dashboard: buildDashboardInput({
        salesOverview: new Types.ObjectId('662d4f6e7a1c2b00124f0601'),
        salesByDay: new Types.ObjectId('662d4f6e7a1c2b00124f0602'),
        customersSummary: new Types.ObjectId('662d4f6e7a1c2b00124f0603'),
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
});
