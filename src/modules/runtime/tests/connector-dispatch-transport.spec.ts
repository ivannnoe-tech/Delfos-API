import { ConnectorDispatchConfig } from '../../../config/app-config.service';
import { buildConnectorDispatchTlsOptions } from '../dispatch/connector-dispatch-transport';

function config(overrides: Partial<ConnectorDispatchConfig> = {}): ConnectorDispatchConfig {
  return {
    enabled: true,
    baseUrl: 'https://connectors.local/dispatch',
    timeoutMs: 5000,
    maxRetries: 2,
    clientCertBase64: Buffer.from('CERT-PEM').toString('base64'),
    clientKeyBase64: Buffer.from('KEY-PEM').toString('base64'),
    caBase64: Buffer.from('CA-PEM').toString('base64'),
    ...overrides,
  };
}

describe('buildConnectorDispatchTlsOptions', () => {
  it('decodes the base64 mTLS material and enforces certificate verification', () => {
    const options = buildConnectorDispatchTlsOptions(config());

    expect(options.rejectUnauthorized).toBe(true);
    expect(options.cert?.toString('utf8')).toBe('CERT-PEM');
    expect(options.key?.toString('utf8')).toBe('KEY-PEM');
    expect(options.ca?.toString('utf8')).toBe('CA-PEM');
  });

  it('leaves the material undefined when not configured but still verifies certificates', () => {
    const options = buildConnectorDispatchTlsOptions(
      config({ clientCertBase64: undefined, clientKeyBase64: undefined, caBase64: undefined }),
    );

    expect(options.cert).toBeUndefined();
    expect(options.key).toBeUndefined();
    expect(options.ca).toBeUndefined();
    expect(options.rejectUnauthorized).toBe(true);
  });
});
