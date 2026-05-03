import { ConnectorCommandSafeMetadata } from '../connector-command-shape';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';

export type RuntimeReaderAdapterRecord = Readonly<Record<string, unknown>>;

export interface RuntimeReaderAdapterMetadataSource extends RuntimeReaderAdapterRecord {
  readonly metadata?: RuntimeReaderAdapterRecord;
  readonly safeMetadata?: RuntimeReaderAdapterRecord;
}

export function isRuntimeReaderRecord(value: unknown): value is RuntimeReaderAdapterRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRuntimeReaderString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const text = (value as { toString: () => string }).toString();

    if (text && text !== '[object Object]') {
      return text;
    }
  }

  return undefined;
}

export function toRuntimeReaderBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function toRuntimeReaderRecord(value: unknown): RuntimeReaderAdapterRecord | undefined {
  return isRuntimeReaderRecord(value) ? value : undefined;
}

export function toRuntimeReaderArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function hasRuntimeReaderTenant(
  source: { readonly tenantId?: unknown },
  tenantId: string,
): boolean {
  return toRuntimeReaderString(source.tenantId) === tenantId;
}

export function getRuntimeReaderEntityId(source: {
  readonly id?: unknown;
  readonly _id?: unknown;
}): string | undefined {
  return toRuntimeReaderString(source.id ?? source._id);
}

export function buildRuntimeReaderSafeMetadata(
  safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ...sources: readonly (RuntimeReaderAdapterRecord | undefined)[]
): ConnectorCommandSafeMetadata | undefined {
  const metadata = sources.reduce<Record<string, unknown>>((accumulator, source) => {
    if (!source) {
      return accumulator;
    }

    Object.entries(source).forEach(([key, value]) => {
      accumulator[key] = value;
    });

    return accumulator;
  }, {});

  const safeMetadata = safeMetadataBuilder.build({ metadata });

  return Object.keys(safeMetadata).length > 0 ? safeMetadata : undefined;
}
