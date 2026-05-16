/**
 * Pure, stateless helpers for the runtime connector reference resolver:
 * readiness blocker construction, de-duplication and descriptor building.
 * Extracted from `runtime-connector-reference-resolver.ts` so each file
 * stays within the size guideline. No runtime/dispatch behavior here —
 * foundation-only (ADR-0014/0015, gated by ADR-0021/0022).
 */
import { BridgeReadinessBlockerShape } from './bridge-types';
import {
  RuntimeConnectorFieldMappingDescriptor,
  RuntimeConnectorLogicalFieldDescriptor,
  RuntimeConnectorSourceDescriptor,
} from './runtime-connector-reference.types';
import {
  PartialResolution,
  RuntimeConnectionLike,
  RuntimeDatasetLike,
  RuntimeFieldMappingLike,
} from './runtime-connector-reference-resolver.types';
import { RuntimeConnectorSafeMetadataBuilder } from './runtime-connector-safe-metadata-builder';

export function buildReadinessBlocker(
  code: string,
  message: string,
  target?: string,
): BridgeReadinessBlockerShape {
  return {
    code,
    message,
    target,
  };
}

export function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function uniqueFieldMappings(
  mappings: readonly RuntimeConnectorFieldMappingDescriptor[],
): RuntimeConnectorFieldMappingDescriptor[] {
  const seen = new Set<string>();

  return mappings.filter((mapping) => {
    if (seen.has(mapping.fieldMappingId)) {
      return false;
    }

    seen.add(mapping.fieldMappingId);
    return true;
  });
}

export function uniqueLogicalFields(
  fields: readonly RuntimeConnectorLogicalFieldDescriptor[],
): RuntimeConnectorLogicalFieldDescriptor[] {
  const seen = new Set<string>();

  return fields.filter((field) => {
    if (seen.has(field.logicalField)) {
      return false;
    }

    seen.add(field.logicalField);
    return true;
  });
}

export function unresolvedPartial(
  safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  blocker: BridgeReadinessBlockerShape,
): PartialResolution {
  return {
    resolved: false,
    blockers: [blocker],
    safeMetadata: safeMetadataBuilder.build({
      metadata: {
        blockerCode: blocker.code,
      },
    }),
  };
}

export function buildFieldMappingDescriptors(
  safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  dataset: RuntimeDatasetLike,
  mappings: readonly RuntimeFieldMappingLike[],
): RuntimeConnectorFieldMappingDescriptor[] {
  return mappings
    .filter((mapping) => mapping.tenantId === dataset.tenantId)
    .map<RuntimeConnectorFieldMappingDescriptor | undefined>((mapping) => {
      const sourceFieldPath = mapping.sourceFieldPath ?? mapping.sourceField ?? mapping.sourcePath;
      if (!sourceFieldPath) {
        return undefined;
      }

      const logicalField = mapping.logicalField ?? mapping.targetField;
      const dataType = mapping.dataType ?? mapping.targetType;
      const safeMetadata = safeMetadataBuilder.build({
        metadata: mapping.safeMetadata,
      });

      return {
        fieldMappingId: mapping.id,
        datasetId: dataset.id,
        datasetKey: dataset.datasetKey,
        targetField: mapping.targetField,
        sourceObject: mapping.sourceObject,
        sourceFieldPath,
        logicalField,
        dataType,
        required: mapping.required,
        safeMetadata,
        source: {
          sourceObject: mapping.sourceObject,
          sourceFieldPath,
          sourceFieldType: dataType,
          required: mapping.required,
        },
        logical: {
          logicalField,
          dataType,
          logicalType: dataType,
          required: mapping.required,
          sourceFieldPath,
          safeMetadata,
        },
        transform: mapping.transform,
        status: mapping.status,
      };
    })
    .filter((mapping): mapping is RuntimeConnectorFieldMappingDescriptor => mapping !== undefined);
}

export function buildSourceDescriptor(
  safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  sourceType: string,
  connection: RuntimeConnectionLike,
  credentialRef: string | undefined,
  dataset: RuntimeDatasetLike,
  mappings: readonly RuntimeConnectorFieldMappingDescriptor[],
): RuntimeConnectorSourceDescriptor {
  const firstMapping = mappings[0];
  const safeMetadata = safeMetadataBuilder.build({
    metadata: {
      ...dataset.safeMetadata,
      ...connection.safeMetadata,
      sourceType,
      sourceObject: firstMapping?.sourceObject,
      sourceFieldPath: firstMapping?.sourceFieldPath,
    },
  });

  return {
    sourceType,
    connectionId: connection.id,
    credentialRef,
    sourceObject: firstMapping?.sourceObject,
    sourceFieldPath: firstMapping?.sourceFieldPath,
    schemaMappingVersion: dataset.schemaMappingVersion,
    safeMetadata,
    metadata: safeMetadata,
  };
}
