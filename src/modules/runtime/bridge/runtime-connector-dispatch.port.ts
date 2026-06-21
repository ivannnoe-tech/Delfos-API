import { RuntimeConnectorBridgeSafeError } from './bridge-types';
import {
  ConnectorCommandSafeMetadata,
  ConnectorExecutionCommandShape,
  ConnectorExecutionStatusShape,
} from './connector-command-shape';

/**
 * Safe outcome of attempting to dispatch a prepared connector command. Mirrors
 * the conceptual delfos-connectors execution result (status + safe metadata)
 * WITHOUT carrying any raw payload — never includes the command itself, its
 * `credentialRef`, or any secret value.
 */
export interface RuntimeConnectorDispatchResult {
  readonly dispatched: boolean;
  readonly status: ConnectorExecutionStatusShape;
  readonly safeMessage: string;
  readonly safeError?: RuntimeConnectorBridgeSafeError;
  readonly safeMetadata: ConnectorCommandSafeMetadata;
}

/**
 * Port for dispatching a prepared connector command (ADR-0038). Named per
 * `docs/runtime-connectors-bridge-resolver-design.md`. The real transport
 * (HTTP síncrono + mTLS) is a later increment; this port lets the bridge flow
 * stay closed end-to-end behind a no-op until then.
 */
export interface RuntimeConnectorDispatchPort {
  dispatch(command: ConnectorExecutionCommandShape): Promise<RuntimeConnectorDispatchResult>;
}

const DISPATCH_NOT_SUPPORTED_MESSAGE =
  'Connector dispatch is not supported yet. No external call was made.';

/**
 * No-op dispatch seam (Phase 2). Wires the dispatch step into the bridge flow
 * without any transport: the command is intentionally NOT sent anywhere. Only
 * the command's safe identifiers (`capability`, `mode`) are echoed back as
 * metadata — never `credentialRef`, `connectionId` or any payload. Returns a
 * `not_supported` outcome so the flow stays closed and fully audited until the
 * real transport increment (ADR-0038).
 */
export class NoOpConnectorDispatchAdapter implements RuntimeConnectorDispatchPort {
  async dispatch(command: ConnectorExecutionCommandShape): Promise<RuntimeConnectorDispatchResult> {
    const safeMetadata: ConnectorCommandSafeMetadata = {
      capability: command.capability,
      mode: command.mode,
    };

    return {
      dispatched: false,
      status: 'not_supported',
      safeMessage: DISPATCH_NOT_SUPPORTED_MESSAGE,
      safeError: {
        code: 'connector_dispatch_not_supported',
        safeMessage: DISPATCH_NOT_SUPPORTED_MESSAGE,
        category: 'not_supported',
        retryable: false,
        safeMetadata,
      },
      safeMetadata,
    };
  }
}
