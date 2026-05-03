import {
  RuntimeConnectorLimitOverrides,
  RuntimeConnectorLimits,
  RuntimeConnectorLimitsPolicyInput,
} from './bridge-types';

export const RUNTIME_CONNECTOR_DEFAULT_LIMITS: RuntimeConnectorLimits = Object.freeze({
  timeoutMs: 5000,
  maxRows: 100,
  previewLimit: 20,
  maxMetadataLength: 256,
});

const RUNTIME_CONNECTOR_MAX_LIMITS: RuntimeConnectorLimits = Object.freeze({
  timeoutMs: 30000,
  maxRows: 1000,
  previewLimit: 100,
  maxMetadataLength: 256,
});

export class RuntimeConnectorLimitsPolicy {
  resolve(input: RuntimeConnectorLimitsPolicyInput = {}): RuntimeConnectorLimits {
    const overrides = input.overrides ?? {};

    return Object.freeze({
      timeoutMs: resolveLimit(
        overrides.timeoutMs,
        RUNTIME_CONNECTOR_DEFAULT_LIMITS.timeoutMs,
        RUNTIME_CONNECTOR_MAX_LIMITS.timeoutMs,
      ),
      maxRows: resolveLimit(
        overrides.maxRows,
        RUNTIME_CONNECTOR_DEFAULT_LIMITS.maxRows,
        RUNTIME_CONNECTOR_MAX_LIMITS.maxRows,
      ),
      previewLimit: resolveLimit(
        overrides.previewLimit,
        RUNTIME_CONNECTOR_DEFAULT_LIMITS.previewLimit,
        RUNTIME_CONNECTOR_MAX_LIMITS.previewLimit,
      ),
      maxMetadataLength: resolveLimit(
        overrides.maxMetadataLength,
        RUNTIME_CONNECTOR_DEFAULT_LIMITS.maxMetadataLength,
        RUNTIME_CONNECTOR_MAX_LIMITS.maxMetadataLength,
      ),
    });
  }
}

function resolveLimit(value: unknown, defaultValue: number, maxValue: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return defaultValue;
  }

  return Math.min(value, maxValue);
}

export type { RuntimeConnectorLimitOverrides };
