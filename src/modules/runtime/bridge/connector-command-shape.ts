/**
 * Internal local shape for the future connector command envelope.
 *
 * This mirrors the conceptual delfos-connectors contract without importing
 * delfos-connectors or exposing a public HTTP DTO.
 */
export const CONNECTOR_CAPABILITY_SHAPES = [
  'test_connection',
  'inspect_schema',
  'preview_dataset',
  'execute_query_preview',
  'generate_report_preview',
  'export_report',
  'refresh_dashboard_data',
  'validate_mapping',
  'estimate_query_cost',
] as const;

export type ConnectorCapabilityShape = (typeof CONNECTOR_CAPABILITY_SHAPES)[number];

export const CONNECTOR_EXECUTION_MODE_SHAPES = [
  'dry_run',
  'demo',
  'preview',
  'execute',
  'export',
] as const;

export type ConnectorExecutionModeShape = (typeof CONNECTOR_EXECUTION_MODE_SHAPES)[number];

export const CONNECTOR_EXECUTION_STATUS_SHAPES = [
  'created',
  'queued',
  'accepted',
  'running',
  'blocked',
  'completed',
  'completed_demo',
  'failed',
  'cancelled',
  'expired',
  'not_supported',
] as const;

export type ConnectorExecutionStatusShape = (typeof CONNECTOR_EXECUTION_STATUS_SHAPES)[number];

export type ConnectorCommandSafeMetadataValue = string | number | boolean | null;

export type ConnectorCommandSafeMetadata = Record<string, ConnectorCommandSafeMetadataValue>;

export interface ConnectorExecutionCommandShape {
  executionRequestId: string;
  tenantId: string;
  actorId?: string;
  actorRole?: string;
  connectionId?: string;
  credentialRef?: string;
  datasetId?: string;
  fieldMappingId?: string;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  sourceType?: string;
  capability: ConnectorCapabilityShape;
  mode: ConnectorExecutionModeShape;
  requestedAt: string;
  requestId: string;
  correlationId: string;
  safeParameters: Record<string, unknown>;
  schemaMappingVersion?: string;
  maxRows?: number;
  timeoutMs?: number;
  previewLimit?: number;
  metadata: ConnectorCommandSafeMetadata;
}

const connectorCapabilities = new Set<string>(CONNECTOR_CAPABILITY_SHAPES);
const connectorModes = new Set<string>(CONNECTOR_EXECUTION_MODE_SHAPES);

export function isConnectorCapabilityShape(value: unknown): value is ConnectorCapabilityShape {
  return typeof value === 'string' && connectorCapabilities.has(value);
}

export function isConnectorExecutionModeShape(
  value: unknown,
): value is ConnectorExecutionModeShape {
  return typeof value === 'string' && connectorModes.has(value);
}
