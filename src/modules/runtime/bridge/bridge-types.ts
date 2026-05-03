import { ExecutionRequestKind, ExecutionRequestMode } from '../schemas/execution-request.schema';
import {
  ConnectorCapabilityShape,
  ConnectorCommandSafeMetadata,
  ConnectorExecutionCommandShape,
  ConnectorExecutionModeShape,
} from './connector-command-shape';

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
