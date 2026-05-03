import { RuntimeConnectorSafeMetadataBuilder } from '../bridge';

describe('RuntimeConnectorSafeMetadataBuilder', () => {
  const builder = new RuntimeConnectorSafeMetadataBuilder();

  it('preserves safe context fields and scalar metadata', () => {
    const result = builder.build({
      metadata: {
        domain: 'sales',
        rowCount: 10,
        preview: true,
      },
      context: {
        kind: 'query',
        mode: 'future_runtime',
        capability: 'execute_query_preview',
        sourceType: 'rest_json',
        status: 'accepted',
        readiness: {
          ready: true,
          checksCount: 3,
          warningsCount: 1,
          blockersCount: 0,
        },
        limits: {
          timeoutMs: 5000,
          maxRows: 100,
          previewLimit: 20,
        },
      },
    });

    expect(result).toMatchObject({
      domain: 'sales',
      rowCount: 10,
      preview: true,
      kind: 'query',
      mode: 'future_runtime',
      capability: 'execute_query_preview',
      sourceType: 'rest_json',
      status: 'accepted',
      ready: true,
      checksCount: 3,
      warningsCount: 1,
      blockersCount: 0,
      timeoutMs: 5000,
      maxRows: 100,
      previewLimit: 20,
    });
  });

  it('removes password, token, and secret fields', () => {
    const result = builder.build({
      metadata: {
        password: 'must-not-leak',
        accessToken: 'must-not-leak',
        clientSecret: 'must-not-leak',
        domain: 'sales',
      },
    });

    expect(result).toEqual({ domain: 'sales' });
  });

  it('removes connection string values', () => {
    const result = builder.build({
      metadata: {
        source: 'postgres://user:password@example.test/db',
        connectionString: 'Server=example;Password=must-not-leak',
        domain: 'sales',
      },
    });

    expect(result).toEqual({ domain: 'sales' });
  });

  it('limits long strings to 256 characters', () => {
    const result = builder.build({
      metadata: {
        description: 'a'.repeat(300),
      },
    });

    expect(result.description).toHaveLength(256);
  });

  it('does not mutate input and removes raw nested objects', () => {
    const metadata = {
      domain: 'sales',
      rawPayload: { nested: 'must-not-leak' },
      nested: { safe: 'also-not-allowed' },
    };

    const result = builder.build({ metadata });

    expect(result).toEqual({ domain: 'sales' });
    expect(metadata).toEqual({
      domain: 'sales',
      rawPayload: { nested: 'must-not-leak' },
      nested: { safe: 'also-not-allowed' },
    });
  });
});
