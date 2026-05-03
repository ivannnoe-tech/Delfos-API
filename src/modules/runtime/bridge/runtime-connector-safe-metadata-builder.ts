import {
  RuntimeConnectorSafeMetadataBuilderInput,
  RuntimeConnectorSafeMetadataContext,
} from './bridge-types';
import {
  ConnectorCommandSafeMetadata,
  ConnectorCommandSafeMetadataValue,
} from './connector-command-shape';
import {
  isRuntimeConnectorForbiddenFieldName,
  isRuntimeConnectorSuspiciousValue,
} from './runtime-connector-security';

export class RuntimeConnectorSafeMetadataBuilder {
  build(input: RuntimeConnectorSafeMetadataBuilderInput): ConnectorCommandSafeMetadata {
    return Object.freeze({
      ...this.sanitizeRecord(input.metadata),
      ...this.buildContextMetadata(input.context),
    });
  }

  private buildContextMetadata(
    context: RuntimeConnectorSafeMetadataContext | undefined,
  ): ConnectorCommandSafeMetadata {
    if (!context) {
      return {};
    }

    return this.sanitizeRecord({
      kind: context.kind,
      mode: context.mode,
      capability: context.capability,
      sourceType: context.sourceType,
      status: context.status,
      ready: context.readiness?.ready,
      checksCount: context.readiness?.checksCount,
      warningsCount: context.readiness?.warningsCount,
      blockersCount: context.readiness?.blockersCount,
      timeoutMs: context.limits?.timeoutMs,
      maxRows: context.limits?.maxRows,
      previewLimit: context.limits?.previewLimit,
    });
  }

  private sanitizeRecord(input: Record<string, unknown> | undefined): ConnectorCommandSafeMetadata {
    if (!input) {
      return {};
    }

    return Object.entries(input).reduce<ConnectorCommandSafeMetadata>((metadata, [key, value]) => {
      const sanitizedValue = this.sanitizeValue(key, value);

      if (sanitizedValue !== undefined) {
        metadata[key] = sanitizedValue;
      }

      return metadata;
    }, {});
  }

  private sanitizeValue(
    key: string,
    value: unknown,
  ): ConnectorCommandSafeMetadataValue | undefined {
    if (isRuntimeConnectorForbiddenFieldName(key) || isRuntimeConnectorSuspiciousValue(value)) {
      return undefined;
    }

    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return Number.isNaN(value) ? undefined : value;
    }

    if (typeof value === 'string') {
      return value.slice(0, 256);
    }

    return undefined;
  }
}
