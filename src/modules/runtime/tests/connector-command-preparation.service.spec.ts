import { PrepareRuntimeConnectorCommandResult } from '../bridge';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import {
  ConnectorBridgeEventRecorderPort,
  ConnectorCommandPreparationService,
  RecordedBridgeEvent,
  RuntimeConnectorBridgeResolverPort,
} from '../services/connector-command-preparation.service';

const INPUT = {
  executionRequestId: 'er-1',
  tenantId: 't-1',
  actorId: 'a-1',
  actorRole: 'operator',
  requestId: 'req-1',
  correlationId: 'corr-1',
};

function preparedResult(): PrepareRuntimeConnectorCommandResult {
  return {
    prepared: true,
    // The raw command carries credentialRef — it MUST never leak out of the service.
    command: {
      executionRequestId: 'er-1',
      tenantId: 't-1',
      credentialRef: 'cred_must_not_leak',
    } as unknown as PrepareRuntimeConnectorCommandResult['command'],
    blockers: [],
    events: [
      {
        eventType: 'command_prepared',
        status: ExecutionRequestStatus.Accepted,
        safeMessage: 'Connector command prepared in memory. No dispatch was started.',
        safeMetadata: { capability: 'query.read' },
      },
    ],
  };
}

function blockedResult(): PrepareRuntimeConnectorCommandResult {
  return {
    prepared: false,
    blockers: [{ code: 'readiness_blocked', message: 'blocked' }],
    safeError: {
      code: 'readiness_blocked',
      safeMessage: 'Execution request readiness blocked command preparation.',
      category: 'readiness',
      retryable: false,
      safeMetadata: { blockersCount: 1 },
    },
    events: [
      {
        eventType: 'command_blocked',
        status: ExecutionRequestStatus.Blocked,
        safeMessage: 'Execution request readiness blocked command preparation.',
        safeMetadata: { blockersCount: 1 },
      },
    ],
  };
}

function createRecorder(): ConnectorBridgeEventRecorderPort & {
  readonly recorded: RecordedBridgeEvent[];
} {
  const recorded: RecordedBridgeEvent[] = [];
  return {
    recorded,
    record: jest.fn(async (event: RecordedBridgeEvent) => {
      recorded.push(event);
    }),
  };
}

describe('ConnectorCommandPreparationService', () => {
  it('prepares a command, records the bridge events, and never leaks the raw command/credentialRef', async () => {
    const prepareCommand = jest.fn(async () => preparedResult());
    const resolver: RuntimeConnectorBridgeResolverPort = { prepareCommand };
    const recorder = createRecorder();
    const service = new ConnectorCommandPreparationService(resolver, recorder);

    const result = await service.prepare(INPUT);

    expect(prepareCommand).toHaveBeenCalledWith(INPUT);
    expect(result.prepared).toBe(true);
    expect(result.status).toBe(ExecutionRequestStatus.Accepted);
    expect(recorder.recorded).toHaveLength(1);
    expect(recorder.recorded[0]).toMatchObject({
      executionRequestId: 'er-1',
      tenantId: 't-1',
      eventType: 'command_prepared',
    });
    // The raw command (and its credentialRef) must NOT be exposed by the result.
    expect((result as { command?: unknown }).command).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('cred_must_not_leak');
  });

  it('records the blocked event and surfaces the safe error when preparation is blocked', async () => {
    const resolver: RuntimeConnectorBridgeResolverPort = {
      prepareCommand: jest.fn(async () => blockedResult()),
    };
    const recorder = createRecorder();
    const service = new ConnectorCommandPreparationService(resolver, recorder);

    const result = await service.prepare(INPUT);

    expect(result.prepared).toBe(false);
    expect(result.status).toBe(ExecutionRequestStatus.Blocked);
    expect(result.safeError?.code).toBe('readiness_blocked');
    expect(recorder.recorded).toHaveLength(1);
    expect(recorder.recorded[0].eventType).toBe('command_blocked');
  });
});
