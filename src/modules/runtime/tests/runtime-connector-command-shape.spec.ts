import {
  ConnectorExecutionCommandShape,
  RuntimeConnectorLocalCommandShapeValidator,
} from '../bridge';

describe('RuntimeConnectorLocalCommandShapeValidator', () => {
  const validator = new RuntimeConnectorLocalCommandShapeValidator();

  it('accepts a valid command shape with safe references', () => {
    const result = validator.validate(createCommand());

    expect(result).toEqual({
      valid: true,
      command: createCommand(),
    });
  });

  it.each([
    ['tenantId'],
    ['executionRequestId'],
    ['requestId'],
    ['correlationId'],
    ['requestedAt'],
  ] as const)('fails when %s is missing', (field) => {
    const command = createCommand({ [field]: '' });
    const result = validator.validate(command);

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_COMMAND_REQUIRED_FIELD',
        retryable: false,
      },
    });
  });

  it('fails when metadata contains forbidden fields', () => {
    const result = validator.validate(
      createCommand({
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
        },
      }),
    );

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_COMMAND_FORBIDDEN_FIELD',
        category: 'security',
      },
    });
  });

  it('fails when safeParameters contains forbidden fields', () => {
    const result = validator.validate(
      createCommand({
        safeParameters: {
          logicalPeriod: 'last_7_days',
          nested: {
            password: 'must-not-leak',
          },
        },
      }),
    );

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_COMMAND_FORBIDDEN_FIELD',
        category: 'security',
      },
    });
  });

  it('passes safe credentialRef and connectionId references', () => {
    const result = validator.validate(
      createCommand({
        credentialRef: 'cred_662d4f6e7a1c2b00124f0401',
        connectionId: '662d4f6e7a1c2b00124f0201',
      }),
    );

    expect(result.valid).toBe(true);
  });

  it('fails suspicious credentialRef values', () => {
    const result = validator.validate(
      createCommand({
        credentialRef: 'Bearer abcdefghijklmnopqrstuvwxyz',
      }),
    );

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_CREDENTIAL_REF_UNSAFE',
        category: 'security',
      },
    });
  });

  it('fails connectionId values that look like connection strings', () => {
    const result = validator.validate(
      createCommand({
        connectionId: 'Server=example;Database=delfos;Password=must-not-leak',
      }),
    );

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_CONNECTION_ID_UNSAFE',
        category: 'security',
      },
    });
  });

  it('fails suspicious values in metadata or safeParameters', () => {
    const result = validator.validate(
      createCommand({
        safeParameters: {
          logicalPeriod: 'token=must-not-leak',
        },
      }),
    );

    expect(result).toMatchObject({
      valid: false,
      safeError: {
        code: 'RUNTIME_CONNECTOR_COMMAND_SUSPICIOUS_VALUE',
        category: 'security',
      },
    });
  });
});

function createCommand(
  overrides: Partial<ConnectorExecutionCommandShape> = {},
): ConnectorExecutionCommandShape {
  return {
    executionRequestId: '662d4f6e7a1c2b00124f0901',
    tenantId: '662d4f6e7a1c2b00124f0001',
    actorId: 'dev-actor-001',
    actorRole: 'operator',
    connectionId: '662d4f6e7a1c2b00124f0201',
    credentialRef: 'cred_662d4f6e7a1c2b00124f0401',
    datasetId: '662d4f6e7a1c2b00124f0501',
    queryDefinitionId: '662d4f6e7a1c2b00124f0601',
    sourceType: 'rest_json',
    capability: 'execute_query_preview',
    mode: 'preview',
    requestedAt: '2026-05-03T12:00:00.000Z',
    requestId: 'req_demo_001',
    correlationId: 'corr_demo_001',
    safeParameters: {
      logicalPeriod: 'last_7_days',
    },
    schemaMappingVersion: 'mapping_v1',
    maxRows: 100,
    timeoutMs: 5000,
    previewLimit: 20,
    metadata: {
      domain: 'sales',
    },
    ...overrides,
  };
}
