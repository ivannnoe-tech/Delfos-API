import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';
import { ConnectorBridgeEventRecorder } from '../services/connector-bridge-event-recorder';
import { RecordedBridgeEvent } from '../services/connector-command-preparation.service';
import { ExecutionRequestActorContext } from '../services/execution-request-actor-context';
import { ExecutionRequestEventsService } from '../services/execution-request-events.service';

type CreateEventCall = [string, CreateExecutionRequestEventDto, ExecutionRequestActorContext];

function baseEvent(overrides: Partial<RecordedBridgeEvent> = {}): RecordedBridgeEvent {
  return {
    executionRequestId: 'er-1',
    tenantId: 't-1',
    actorId: 'a-1',
    actorRole: 'operator',
    eventType: 'command_prepared',
    status: ExecutionRequestStatus.Accepted,
    safeMessage: 'Connector command prepared in memory. No dispatch was started.',
    safeMetadata: { capability: 'query.read' },
    ...overrides,
  };
}

function createRecorderWithSpy() {
  const calls: CreateEventCall[] = [];
  const createEvent = jest.fn(
    async (
      executionRequestId: string,
      dto: CreateExecutionRequestEventDto,
      actor: ExecutionRequestActorContext,
    ) => {
      calls.push([executionRequestId, dto, actor]);
      return {} as never;
    },
  );
  const recorder = new ConnectorBridgeEventRecorder({
    createEvent,
  } as unknown as ExecutionRequestEventsService);
  return { recorder, createEvent, calls };
}

describe('ConnectorBridgeEventRecorder', () => {
  it('records a prepared bridge event as an accepted execution-request timeline event', async () => {
    const { recorder, createEvent, calls } = createRecorderWithSpy();

    await recorder.record(baseEvent());

    expect(createEvent).toHaveBeenCalledTimes(1);
    const [executionRequestId, dto, actor] = calls[0];
    expect(executionRequestId).toBe('er-1');
    expect(dto).toMatchObject({
      tenantId: 't-1',
      eventType: ExecutionRequestEventType.Accepted,
      message: 'Connector command prepared in memory. No dispatch was started.',
      reason: 'command_prepared',
    });
    expect(dto.metadata).toMatchObject({
      capability: 'query.read',
      bridgeEventType: 'command_prepared',
    });
    expect(actor).toEqual({ actorId: 'a-1', actorRole: 'operator' });
  });

  it.each([
    [ExecutionRequestStatus.Blocked, ExecutionRequestEventType.Blocked, 'command_blocked'],
    [
      ExecutionRequestStatus.NotSupported,
      ExecutionRequestEventType.NotSupported,
      'command_not_supported',
    ],
    [ExecutionRequestStatus.Failed, ExecutionRequestEventType.Failed, 'command_validation_failed'],
  ])(
    'maps bridge status %s to execution-request event type %s',
    async (status, eventType, bridgeEventType) => {
      const { recorder, calls } = createRecorderWithSpy();

      await recorder.record(
        baseEvent({
          status: status as RecordedBridgeEvent['status'],
          eventType: bridgeEventType as RecordedBridgeEvent['eventType'],
        }),
      );

      expect(calls[0][1].eventType).toBe(eventType);
    },
  );

  it('drops an unknown actor role instead of forwarding an invalid value', async () => {
    const { recorder, calls } = createRecorderWithSpy();

    await recorder.record(baseEvent({ actorRole: 'super-hacker' }));

    expect(calls[0][2]).toEqual({ actorId: 'a-1', actorRole: undefined });
  });
});
