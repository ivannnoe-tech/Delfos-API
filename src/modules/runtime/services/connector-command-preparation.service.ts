import { Inject, Injectable } from '@nestjs/common';

import {
  PrepareRuntimeConnectorCommandInput,
  PrepareRuntimeConnectorCommandResult,
  RuntimeConnectorBridgeEventShape,
  RuntimeConnectorBridgeEventStatus,
  RuntimeConnectorBridgeSafeError,
  RuntimeConnectorDispatchPort,
  RuntimeConnectorDispatchResult,
} from '../bridge';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';

/**
 * Port over the runtime connector bridge resolver. Keeps this service decoupled
 * from how the resolver (and its many readers) is wired.
 */
export interface RuntimeConnectorBridgeResolverPort {
  prepareCommand(
    input: PrepareRuntimeConnectorCommandInput,
  ): Promise<PrepareRuntimeConnectorCommandResult>;
}

/** A single bridge event ready to be persisted on the execution-request timeline. */
export interface RecordedBridgeEvent {
  readonly executionRequestId: string;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly eventType: RuntimeConnectorBridgeEventShape['eventType'];
  readonly status: RuntimeConnectorBridgeEventShape['status'];
  readonly safeMessage: string;
  readonly safeMetadata: RuntimeConnectorBridgeEventShape['safeMetadata'];
}

/** Port that persists a safe bridge event (timeline/audit), implemented by the module. */
export interface ConnectorBridgeEventRecorderPort {
  record(event: RecordedBridgeEvent): Promise<void>;
}

export interface ConnectorCommandPreparationResult {
  readonly prepared: boolean;
  readonly status: ExecutionRequestStatus;
  readonly safeError?: RuntimeConnectorBridgeSafeError;
  readonly events: readonly RuntimeConnectorBridgeEventShape[];
  readonly dispatch?: RuntimeConnectorDispatchResult;
}

export const RUNTIME_CONNECTOR_BRIDGE_RESOLVER = Symbol('RUNTIME_CONNECTOR_BRIDGE_RESOLVER');
export const CONNECTOR_BRIDGE_EVENT_RECORDER = Symbol('CONNECTOR_BRIDGE_EVENT_RECORDER');
export const CONNECTOR_DISPATCH_PORT = Symbol('CONNECTOR_DISPATCH_PORT');

/**
 * Phase 2 (ADR-0037 / ADR-0038): prepares and validates the
 * `ConnectorExecutionCommand` in memory, then runs it through the connector
 * dispatch seam, recording every safe outcome on the execution-request
 * timeline. The current dispatch is a no-op that returns `not_supported`, so no
 * real decryption, transport or external call happens — the raw command (which
 * carries `credentialRef`) never leaves this service or its in-process
 * collaborators, and is never surfaced to callers.
 */
@Injectable()
export class ConnectorCommandPreparationService {
  constructor(
    @Inject(RUNTIME_CONNECTOR_BRIDGE_RESOLVER)
    private readonly bridgeResolver: RuntimeConnectorBridgeResolverPort,
    @Inject(CONNECTOR_BRIDGE_EVENT_RECORDER)
    private readonly eventRecorder: ConnectorBridgeEventRecorderPort,
    @Inject(CONNECTOR_DISPATCH_PORT)
    private readonly dispatchPort: RuntimeConnectorDispatchPort,
  ) {}

  async prepare(
    input: PrepareRuntimeConnectorCommandInput,
  ): Promise<ConnectorCommandPreparationResult> {
    const result = await this.bridgeResolver.prepareCommand(input);

    for (const event of result.events) {
      await this.eventRecorder.record(this.toRecordedEvent(input, event));
    }

    let dispatch: RuntimeConnectorDispatchResult | undefined;
    if (result.prepared && result.command) {
      // The dispatch port is an in-process collaborator: the raw command stays
      // inside the trust boundary and is never returned to the caller.
      dispatch = await this.dispatchPort.dispatch(result.command);
      await this.eventRecorder.record(this.toDispatchRecordedEvent(input, dispatch));
    }

    // Deliberately omit `result.command`: the raw command carries `credentialRef`
    // and must never leave this service (ADR-0037 hard boundary). Only the safe,
    // audited outcome (including the safe dispatch result) is surfaced.
    return {
      prepared: result.prepared,
      status: dispatch ? this.dispatchToStatus(dispatch) : this.deriveStatus(result),
      safeError: dispatch?.safeError ?? result.safeError,
      events: result.events,
      dispatch,
    };
  }

  private toRecordedEvent(
    input: PrepareRuntimeConnectorCommandInput,
    event: RuntimeConnectorBridgeEventShape,
  ): RecordedBridgeEvent {
    return {
      executionRequestId: input.executionRequestId,
      tenantId: input.tenantId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      eventType: event.eventType,
      status: event.status,
      safeMessage: event.safeMessage,
      safeMetadata: event.safeMetadata,
    };
  }

  private toDispatchRecordedEvent(
    input: PrepareRuntimeConnectorCommandInput,
    dispatch: RuntimeConnectorDispatchResult,
  ): RecordedBridgeEvent {
    return {
      executionRequestId: input.executionRequestId,
      tenantId: input.tenantId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      eventType: 'command_dispatch_not_supported',
      status: this.dispatchToStatus(dispatch),
      safeMessage: dispatch.safeMessage,
      safeMetadata: dispatch.safeMetadata,
    };
  }

  private deriveStatus(result: PrepareRuntimeConnectorCommandResult): ExecutionRequestStatus {
    if (result.prepared) {
      return ExecutionRequestStatus.Accepted;
    }

    const lastEvent = result.events[result.events.length - 1];
    return lastEvent?.status ?? ExecutionRequestStatus.Blocked;
  }

  private dispatchToStatus(
    dispatch: RuntimeConnectorDispatchResult,
  ): RuntimeConnectorBridgeEventStatus {
    switch (dispatch.status) {
      case 'failed':
        return ExecutionRequestStatus.Failed;
      case 'not_supported':
        return ExecutionRequestStatus.NotSupported;
      default:
        return ExecutionRequestStatus.Accepted;
    }
  }
}
