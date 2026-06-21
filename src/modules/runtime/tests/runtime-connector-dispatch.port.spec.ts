import { ConnectorExecutionCommandShape } from '../bridge/connector-command-shape';
import { NoOpConnectorDispatchAdapter } from '../bridge/runtime-connector-dispatch.port';

function command(
  overrides: Partial<ConnectorExecutionCommandShape> = {},
): ConnectorExecutionCommandShape {
  return {
    executionRequestId: 'er-1',
    tenantId: 't-1',
    capability: 'execute_query_preview',
    mode: 'preview',
    requestedAt: '2026-05-03T12:00:00.000Z',
    requestId: 'req-1',
    correlationId: 'corr-1',
    safeParameters: {},
    metadata: {},
    connectionId: 'conn-secret-1',
    credentialRef: 'cred_must_not_leak',
    ...overrides,
  };
}

describe('NoOpConnectorDispatchAdapter', () => {
  it('returns a not_supported result without dispatching', async () => {
    const result = await new NoOpConnectorDispatchAdapter().dispatch(command());

    expect(result.dispatched).toBe(false);
    expect(result.status).toBe('not_supported');
    expect(result.safeError).toMatchObject({
      code: 'connector_dispatch_not_supported',
      category: 'not_supported',
      retryable: false,
    });
    expect(result.safeMetadata).toMatchObject({
      capability: 'execute_query_preview',
      mode: 'preview',
    });
  });

  it('never leaks the credentialRef, connectionId or any raw command secret', async () => {
    const result = await new NoOpConnectorDispatchAdapter().dispatch(command());
    const json = JSON.stringify(result);

    expect(json).not.toContain('cred_must_not_leak');
    expect(json).not.toContain('conn-secret-1');
  });
});
