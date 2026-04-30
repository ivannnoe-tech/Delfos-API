export interface SeedPreviewCommandContext {
  tenantId: string;
  actorId: string;
  queryDefinitionId: string;
  dashboardDefinitionId: string;
  apiUrl?: string;
  rowLimit?: number;
  rowLimitPerWidget?: number;
}

export function buildDelfosWebCommand(tenantId: string, actorId: string): string {
  return [
    'flutter run -d edge --web-port=5173',
    '--dart-define=API_URL=http://localhost:3000',
    '--dart-define=DELFOS_ADMIN_KEY=$env:DELFOS_ADMIN_KEY',
    `--dart-define=DELFOS_TENANT_ID=${tenantId}`,
    `--dart-define=DELFOS_ACTOR_ID=${actorId}`,
    '--dart-define=DELFOS_ACTOR_ROLE=owner',
  ].join(' ');
}

export function buildListQueryDefinitionsCommand(
  tenantId: string,
  actorId: string,
  apiUrl = 'http://localhost:3000',
): string {
  return [
    `Invoke-RestMethod "${apiUrl}/api/v1/query-definitions?tenantId=${tenantId}" \``,
    buildPowerShellHeaders(tenantId, actorId),
  ].join('\n');
}

export function buildPreviewQueryDefinitionCommand(input: SeedPreviewCommandContext): string {
  const apiUrl = input.apiUrl ?? 'http://localhost:3000';
  const rowLimit = input.rowLimit ?? 5;

  return [
    `Invoke-RestMethod -Method Post "${apiUrl}/api/v1/query-definitions/${input.queryDefinitionId}/preview?tenantId=${input.tenantId}" \``,
    `${buildPowerShellHeaders(input.tenantId, input.actorId)} \``,
    '  -ContentType "application/json" `',
    `  -Body '{"rowLimit":${rowLimit}}'`,
  ].join('\n');
}

export function buildListDashboardDefinitionsCommand(
  tenantId: string,
  actorId: string,
  apiUrl = 'http://localhost:3000',
): string {
  return [
    `Invoke-RestMethod "${apiUrl}/api/v1/dashboard-definitions?tenantId=${tenantId}" \``,
    buildPowerShellHeaders(tenantId, actorId),
  ].join('\n');
}

export function buildPreviewDashboardDefinitionCommand(input: SeedPreviewCommandContext): string {
  const apiUrl = input.apiUrl ?? 'http://localhost:3000';
  const rowLimitPerWidget = input.rowLimitPerWidget ?? 5;

  return [
    `Invoke-RestMethod -Method Post "${apiUrl}/api/v1/dashboard-definitions/${input.dashboardDefinitionId}/preview?tenantId=${input.tenantId}" \``,
    `${buildPowerShellHeaders(input.tenantId, input.actorId)} \``,
    '  -ContentType "application/json" `',
    `  -Body '{"rowLimitPerWidget":${rowLimitPerWidget}}'`,
  ].join('\n');
}

function buildPowerShellHeaders(tenantId: string, actorId: string): string {
  return [
    '  -Headers @{',
    '    "x-delfos-admin-key" = $env:DELFOS_ADMIN_KEY',
    `    "x-delfos-tenant-id" = "${tenantId}"`,
    `    "x-delfos-actor-id" = "${actorId}"`,
    '    "x-delfos-actor-role" = "owner"',
    '  }',
  ].join('\n');
}
