import {
  RuntimeConnectorCommandValidationResult,
  RuntimeConnectorCommandValidationSafeError,
} from './bridge-types';
import {
  ConnectorCommandSafeMetadata,
  ConnectorExecutionCommandShape,
  isConnectorCapabilityShape,
  isConnectorExecutionModeShape,
} from './connector-command-shape';
import {
  containsRuntimeConnectorSuspiciousValue,
  findRuntimeConnectorForbiddenFields,
  isRuntimeConnectorSuspiciousConnectionId,
  isRuntimeConnectorSuspiciousCredentialRef,
} from './runtime-connector-security';

const ALLOWED_COMMAND_FIELDS = new Set([
  'executionRequestId',
  'tenantId',
  'actorId',
  'actorRole',
  'connectionId',
  'credentialRef',
  'datasetId',
  'fieldMappingId',
  'queryDefinitionId',
  'dashboardDefinitionId',
  'reportDefinitionId',
  'sourceType',
  'capability',
  'mode',
  'requestedAt',
  'requestId',
  'correlationId',
  'safeParameters',
  'schemaMappingVersion',
  'maxRows',
  'timeoutMs',
  'previewLimit',
  'metadata',
]);

export interface RuntimeConnectorCommandValidationPort {
  validate(command: ConnectorExecutionCommandShape): RuntimeConnectorCommandValidationResult;
}

export class RuntimeConnectorLocalCommandShapeValidator implements RuntimeConnectorCommandValidationPort {
  validate(command: ConnectorExecutionCommandShape): RuntimeConnectorCommandValidationResult {
    const record: Record<string, unknown> = { ...command };
    const unknownField = Object.keys(record).find((field) => !ALLOWED_COMMAND_FIELDS.has(field));

    if (unknownField) {
      return invalid(
        'RUNTIME_CONNECTOR_COMMAND_UNKNOWN_FIELD',
        'Command contains unsupported field.',
        {
          field: unknownField,
        },
      );
    }

    const requiredFieldError = validateRequiredFields(record);
    if (requiredFieldError) {
      return requiredFieldError;
    }

    if (!isConnectorCapabilityShape(record.capability)) {
      return invalid(
        'RUNTIME_CONNECTOR_CAPABILITY_NOT_SUPPORTED',
        'Connector capability is not supported.',
        { field: 'capability' },
        'not_supported',
      );
    }

    if (!isConnectorExecutionModeShape(record.mode)) {
      return invalid('RUNTIME_CONNECTOR_MODE_NOT_SUPPORTED', 'Connector mode is not supported.', {
        field: 'mode',
      });
    }

    if (Number.isNaN(Date.parse(record.requestedAt as string))) {
      return invalid('RUNTIME_CONNECTOR_REQUESTED_AT_INVALID', 'requestedAt must be an ISO date.', {
        field: 'requestedAt',
      });
    }

    if (
      typeof command.credentialRef === 'string' &&
      isRuntimeConnectorSuspiciousCredentialRef(command.credentialRef)
    ) {
      return invalid(
        'RUNTIME_CONNECTOR_CREDENTIAL_REF_UNSAFE',
        'credentialRef looks unsafe for connector runtime.',
        { field: 'credentialRef' },
        'security',
      );
    }

    if (
      typeof command.connectionId === 'string' &&
      isRuntimeConnectorSuspiciousConnectionId(command.connectionId)
    ) {
      return invalid(
        'RUNTIME_CONNECTOR_CONNECTION_ID_UNSAFE',
        'connectionId looks unsafe for connector runtime.',
        { field: 'connectionId' },
        'security',
      );
    }

    const payloadError = validatePayloadSafety(command);
    if (payloadError) {
      return payloadError;
    }

    return {
      valid: true,
      command,
    };
  }
}

function validateRequiredFields(
  record: Record<string, unknown>,
): RuntimeConnectorCommandValidationResult | undefined {
  const requiredFields = [
    'tenantId',
    'executionRequestId',
    'requestId',
    'correlationId',
    'requestedAt',
    'capability',
    'mode',
  ];

  const missingField = requiredFields.find((field) => !isNonEmptyString(record[field]));

  if (!missingField) {
    return undefined;
  }

  return invalid('RUNTIME_CONNECTOR_COMMAND_REQUIRED_FIELD', `Command missing ${missingField}.`, {
    field: missingField,
  });
}

function validatePayloadSafety(
  command: ConnectorExecutionCommandShape,
): RuntimeConnectorCommandValidationResult | undefined {
  if (!isPlainRecord(command.metadata)) {
    return invalid('RUNTIME_CONNECTOR_METADATA_INVALID', 'metadata must be a safe object.', {
      field: 'metadata',
    });
  }

  if (!isPlainRecord(command.safeParameters)) {
    return invalid(
      'RUNTIME_CONNECTOR_SAFE_PARAMETERS_INVALID',
      'safeParameters must be a safe object.',
      { field: 'safeParameters' },
    );
  }

  if (!isScalarMetadata(command.metadata)) {
    return invalid(
      'RUNTIME_CONNECTOR_METADATA_INVALID_VALUE',
      'metadata must contain only safe scalar values.',
      { field: 'metadata' },
    );
  }

  const forbiddenFields = findRuntimeConnectorForbiddenFields({
    metadata: command.metadata,
    safeParameters: command.safeParameters,
  });

  if (forbiddenFields.length > 0) {
    return invalid(
      'RUNTIME_CONNECTOR_COMMAND_FORBIDDEN_FIELD',
      'Command contains forbidden fields.',
      { fieldsCount: forbiddenFields.length },
      'security',
    );
  }

  if (
    containsRuntimeConnectorSuspiciousValue(command.metadata) ||
    containsRuntimeConnectorSuspiciousValue(command.safeParameters)
  ) {
    return invalid(
      'RUNTIME_CONNECTOR_COMMAND_SUSPICIOUS_VALUE',
      'Command contains suspicious values.',
      undefined,
      'security',
    );
  }

  return undefined;
}

function invalid(
  code: string,
  safeMessage: string,
  metadata?: ConnectorCommandSafeMetadata,
  category: RuntimeConnectorCommandValidationSafeError['category'] = 'validation',
): RuntimeConnectorCommandValidationResult {
  return {
    valid: false,
    safeError: {
      code,
      safeMessage,
      category,
      retryable: false,
      metadata,
    },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isScalarMetadata(metadata: ConnectorCommandSafeMetadata): boolean {
  return Object.values(metadata).every(
    (value) =>
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean',
  );
}
