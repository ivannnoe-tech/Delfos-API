import { createRuntimeConnectorBridgeResolver } from '../bridge/runtime-connector-bridge-resolver.factory';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';

const TENANT_ID = '662d4f6e7a1c2b00124f0001';
const EXECUTION_REQUEST_ID = '662d4f6e7a1c2b00124f0901';
const QUERY_DEFINITION_ID = '662d4f6e7a1c2b00124f0601';
const DATASET_ID = '662d4f6e7a1c2b00124f0501';
const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';

const INPUT = {
  executionRequestId: EXECUTION_REQUEST_ID,
  tenantId: TENANT_ID,
  actorId: 'actor-1',
  actorRole: 'operator',
  requestId: 'req-1',
  correlationId: 'corr-1',
};

interface ReadinessShape {
  readonly checks: readonly { code: string; message: string }[];
  readonly warnings: readonly { code: string; message: string }[];
  readonly blockers: readonly { code: string; message: string }[];
}

function createDependencies(readiness: ReadinessShape) {
  return {
    queryDefinitions: {
      findOne: jest.fn(async () => ({
        id: QUERY_DEFINITION_ID,
        tenantId: TENANT_ID,
        datasetId: DATASET_ID,
        queryKey: 'sales_overview',
        status: 'active',
        type: 'metric',
      })),
    },
    dashboardDefinitions: { findOne: jest.fn(async () => null) },
    reportDefinitions: { findOne: jest.fn(async () => null) },
    datasets: {
      findOne: jest.fn(async () => ({
        id: DATASET_ID,
        tenantId: TENANT_ID,
        datasetKey: 'sales_orders',
        connectionId: CONNECTION_ID,
        sourceType: 'sql_server',
        status: 'active',
        schemaMappingVersion: 'mapping_v1',
      })),
    },
    fieldMappings: {
      findByFilters: jest.fn(async () => ({
        items: [
          {
            id: 'fm-1',
            tenantId: TENANT_ID,
            datasetKey: 'sales_orders',
            targetField: 'total_amount',
            sourcePath: 'ValorTotal',
            targetType: 'number',
            required: true,
            status: 'active',
          },
        ],
      })),
    },
    connections: {
      // ConnectionResponseDto shape: no sourceType, no credentialRef; authType 'none'
      // means no credential is required so the command can be prepared.
      findOne: jest.fn(async () => ({
        id: CONNECTION_ID,
        tenantId: TENANT_ID,
        type: 'database',
        authType: 'none',
        status: 'active',
        hasCredentialReference: false,
      })),
    },
    executionRequestReader: {
      findByTenantAndId: jest.fn(async () => ({
        id: EXECUTION_REQUEST_ID,
        tenantId: TENANT_ID,
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.FutureRuntime,
        status: ExecutionRequestStatus.Accepted,
        requestKey: 'rk-1',
        queryDefinitionId: QUERY_DEFINITION_ID,
      })),
    },
    readinessEvaluator: { evaluate: jest.fn(async () => readiness) },
    clock: { now: () => new Date('2026-05-03T12:00:00.000Z') },
  };
}

describe('createRuntimeConnectorBridgeResolver', () => {
  it('prepares a command through the real reader-adapter chain for a credential-less source', async () => {
    const resolver = createRuntimeConnectorBridgeResolver(
      createDependencies({ checks: [], warnings: [], blockers: [] }),
    );

    const result = await resolver.prepareCommand(INPUT);

    expect(result.prepared).toBe(true);
    expect(result.events[0].eventType).toBe('command_prepared');
  });

  it('blocks command preparation when readiness reports a blocker', async () => {
    const resolver = createRuntimeConnectorBridgeResolver(
      createDependencies({
        checks: [],
        warnings: [],
        blockers: [{ code: 'dataset_not_found', message: 'blocked' }],
      }),
    );

    const result = await resolver.prepareCommand(INPUT);

    expect(result.prepared).toBe(false);
    expect(result.events[0].eventType).toBe('command_blocked');
  });
});
