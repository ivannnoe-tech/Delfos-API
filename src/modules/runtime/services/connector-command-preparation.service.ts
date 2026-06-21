import { Inject, Injectable } from '@nestjs/common';

import {
  PrepareRuntimeConnectorCommandInput,
  PrepareRuntimeConnectorCommandResult,
  RuntimeConnectorBridgeEventShape,
  RuntimeConnectorBridgeSafeError,
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
}

export const RUNTIME_CONNECTOR_BRIDGE_RESOLVER = Symbol('RUNTIME_CONNECTOR_BRIDGE_RESOLVER');
export const CONNECTOR_BRIDGE_EVENT_RECORDER = Symbol('CONNECTOR_BRIDGE_EVENT_RECORDER');

/**
 * Phase 2, 1st increment (ADR-0037 / ADR-0038): wires the runtime connector
 * bridge command-preparation + validation into the application as a real,
 * audited capability. It prepares and validates the `ConnectorExecutionCommand`
 * in memory and records the resulting safe bridge events on the timeline.
 *
 * It does **not** decrypt credentials, dispatch, or make any external call — the
 * raw command (which carries `credentialRef`) never leaves this service.
 */
@Injectable()
export class ConnectorCommandPreparationService {
  constructor(
    @Inject(RUNTIME_CONNECTOR_BRIDGE_RESOLVER)
    private readonly bridgeResolver: RuntimeConnectorBridgeResolverPort,
    @Inject(CONNECTOR_BRIDGE_EVENT_RECORDER)
    private readonly eventRecorder: ConnectorBridgeEventRecorderPort,
  ) {}

  async prepare(
    input: PrepareRuntimeConnectorCommandInput,
  ): Promise<ConnectorCommandPreparationResult> {
    const result = await this.bridgeResolver.prepareCommand(input);

    for (const event of result.events) {
      await this.eventRecorder.record({
        executionRequestId: input.executionRequestId,
        tenantId: input.tenantId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        eventType: event.eventType,
        status: event.status,
        safeMessage: event.safeMessage,
        safeMetadata: event.safeMetadata,
      });
    }

    // Deliberately omit `result.command`: the raw command carries `credentialRef`
    // and must never leave this service (ADR-0037 hard boundary). Only the safe,
    // audited outcome is surfaced.
    return {
      prepared: result.prepared,
      status: this.deriveStatus(result),
      safeError: result.safeError,
      events: result.events,
    };
  }

  private deriveStatus(result: PrepareRuntimeConnectorCommandResult): ExecutionRequestStatus {
    if (result.prepared) {
      return ExecutionRequestStatus.Accepted;
    }

    const lastEvent = result.events[result.events.length - 1];
    return lastEvent?.status ?? ExecutionRequestStatus.Blocked;
  }
}
