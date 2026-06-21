import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.constants';
import {
  ConnectorCapabilityShape,
  ConnectorCommandSafeMetadata,
  ConnectorExecutionCommandShape,
  ConnectorExecutionModeShape,
} from './connector-command-shape';
import { RuntimeConnectorReferenceBundle } from './runtime-connector-reference.types';

export interface RuntimeConnectorCapabilityMapperInput {
  kind: ExecutionRequestKind | string;
  mode: ExecutionRequestMode | string;
  requestedOperation?: string;
}

export type RuntimeConnectorCapabilityMappingResult =
  | {
      supported: true;
      capability: ConnectorCapabilityShape;
      connectorMode: ConnectorExecutionModeShape;
    }
  | {
      supported: false;
      reason: string;
    };

export interface RuntimeConnectorLimits {
  readonly timeoutMs: number;
  readonly maxRows: number;
  readonly previewLimit: number;
  readonly maxMetadataLength: number;
}

export interface RuntimeConnectorLimitOverrides {
  readonly timeoutMs?: unknown;
  readonly maxRows?: unknown;
  readonly previewLimit?: unknown;
  readonly maxMetadataLength?: unknown;
}

export interface RuntimeConnectorLimitsPolicyInput {
  readonly capability?: ConnectorCapabilityShape;
  readonly connectorMode?: ConnectorExecutionModeShape;
  readonly overrides?: RuntimeConnectorLimitOverrides;
}

export interface RuntimeConnectorSafeMetadataContext {
  readonly kind?: string;
  readonly mode?: string;
  readonly capability?: string;
  readonly sourceType?: string;
  readonly status?: string;
  readonly readiness?: {
    readonly checksCount?: number;
    readonly warningsCount?: number;
    readonly blockersCount?: number;
    readonly ready?: boolean;
  };
  readonly limits?: Partial<RuntimeConnectorLimits>;
}

export interface RuntimeConnectorSafeMetadataBuilderInput {
  readonly metadata?: Record<string, unknown>;
  readonly context?: RuntimeConnectorSafeMetadataContext;
}

export interface RuntimeConnectorCommandValidationSafeError {
  readonly code: string;
  readonly safeMessage: string;
  readonly category: 'validation' | 'security' | 'not_supported';
  readonly retryable: false;
  readonly metadata?: ConnectorCommandSafeMetadata;
}

export type RuntimeConnectorCommandValidationResult =
  | {
      readonly valid: true;
      readonly command: ConnectorExecutionCommandShape;
    }
  | {
      readonly valid: false;
      readonly safeError: RuntimeConnectorCommandValidationSafeError;
    };

export interface PrepareRuntimeConnectorCommandInput {
  readonly executionRequestId: string;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly requestId: string;
  readonly correlationId: string;
}

export interface BridgeReadinessItemShape {
  readonly code: string;
  readonly message: string;
  readonly target?: string;
}

export type BridgeReadinessBlockerShape = BridgeReadinessItemShape;

export interface BridgeReadinessResult {
  readonly checks: readonly BridgeReadinessItemShape[];
  readonly warnings: readonly BridgeReadinessItemShape[];
  readonly blockers: readonly BridgeReadinessBlockerShape[];
}

export interface RuntimeConnectorBridgeSafeError {
  readonly code: string;
  readonly safeMessage: string;
  readonly category: 'validation' | 'security' | 'not_supported' | 'readiness' | 'runtime';
  readonly retryable: false;
  readonly safeMetadata: ConnectorCommandSafeMetadata;
}

export type RuntimeConnectorBridgeEventType =
  | 'command_prepared'
  | 'command_blocked'
  | 'command_not_supported'
  | 'command_validation_failed'
  | 'command_dispatch_not_supported';

export type RuntimeConnectorBridgeEventStatus =
  | ExecutionRequestStatus.Accepted
  | ExecutionRequestStatus.Blocked
  | ExecutionRequestStatus.NotSupported
  | ExecutionRequestStatus.Failed;

export interface RuntimeConnectorBridgeEventShape {
  readonly eventType: RuntimeConnectorBridgeEventType;
  readonly status: RuntimeConnectorBridgeEventStatus;
  readonly safeMessage: string;
  readonly safeMetadata: ConnectorCommandSafeMetadata;
}

export interface PrepareRuntimeConnectorCommandResult {
  readonly prepared: boolean;
  readonly command?: ConnectorExecutionCommandShape;
  readonly blockers: readonly BridgeReadinessBlockerShape[];
  readonly safeError?: RuntimeConnectorBridgeSafeError;
  readonly events: readonly RuntimeConnectorBridgeEventShape[];
}

export interface ExecutionRequestLike {
  readonly id: string;
  readonly tenantId: string;
  readonly kind: ExecutionRequestKind | string;
  readonly mode: ExecutionRequestMode | string;
  readonly status: ExecutionRequestStatus | string;
  readonly requestKey: string;
  readonly queryDefinitionId?: string;
  readonly dashboardDefinitionId?: string;
  readonly reportDefinitionId?: string;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
}

export interface RuntimeExecutionRequestReaderPort {
  findByTenantAndId(
    tenantId: string,
    executionRequestId: string,
  ): Promise<ExecutionRequestLike | null>;
}

export interface RuntimeReadinessEvaluatorPort {
  evaluate(executionRequest: ExecutionRequestLike): Promise<BridgeReadinessResult>;
}

export interface RuntimeConnectorReferenceResolverInput {
  readonly tenantId: string;
  readonly executionRequest: ExecutionRequestLike;
}

export interface RuntimeConnectorReferenceBundleResult {
  readonly resolved: boolean;
  readonly references?: RuntimeConnectorReferenceBundle;
  readonly blockers: readonly BridgeReadinessBlockerShape[];
  readonly safeMetadata?: ConnectorCommandSafeMetadata;
}

export interface RuntimeReferenceResolverPort {
  resolveReferences(
    input: RuntimeConnectorReferenceResolverInput,
  ): Promise<RuntimeConnectorReferenceBundleResult>;
}

export interface RuntimeClockPort {
  now(): Date;
}
