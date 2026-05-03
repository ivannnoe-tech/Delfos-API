import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  RuntimeCredentialReferenceLookupDependency,
  RuntimeCredentialReferenceLookupRecord,
  RuntimeCredentialReferenceSafeLookupAdapter,
} from '../bridge';

const TENANT_ID = '662d4f6e7a1c2b00124f0001';
const OTHER_TENANT_ID = '662d4f6e7a1c2b00124f0002';
const CONNECTION_ID = '662d4f6e7a1c2b00124f0201';
const CREDENTIAL_ID = '662d4f6e7a1c2b00124f0401';
const CREDENTIAL_REF = `cred_${CREDENTIAL_ID}`;

describe('RuntimeCredentialReferenceSafeLookupAdapter', () => {
  it('returns one active credentialRef by tenantId and connectionId without secret fields', async () => {
    const adapter = createAdapter({
      records: [
        createCredentialRecord({
          protectedSecretValue: 'must-not-leak',
          secretValue: 'must-not-leak',
          maskedPreview: '********demo',
        }),
      ],
    });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toEqual({
      found: true,
      credential: {
        credentialRef: CREDENTIAL_REF,
        tenantId: TENANT_ID,
        connectionId: CONNECTION_ID,
        status: 'active',
        provider: 'customer-api',
        type: 'api_key',
        safeMetadata: {
          provider: 'customer-api',
          region: 'br',
          status: 'active',
        },
      },
    });
    expectSafeJson(result);
  });

  it('returns a safe credential for lookup by credentialRef', async () => {
    const adapter = createAdapter({ records: [createCredentialRecord()] });

    const result = await adapter.findByCredentialRef(TENANT_ID, CREDENTIAL_REF);

    expect(result.found).toBe(true);
    expect(result.credential).toMatchObject({
      credentialRef: CREDENTIAL_REF,
      tenantId: TENANT_ID,
      connectionId: CONNECTION_ID,
      status: 'active',
      provider: 'customer-api',
      type: 'api_key',
    });
    expectSafeJson(result);
  });

  it('converts a safe id into cred_<id> when credentialRef is absent', async () => {
    const adapter = createAdapter({
      records: [createCredentialRecord({ credentialRef: undefined })],
    });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toMatchObject({
      found: true,
      credential: {
        credentialRef: CREDENTIAL_REF,
      },
    });
  });

  it('preserves provider, type, and sanitized safeMetadata', async () => {
    const adapter = createAdapter({
      records: [
        createCredentialRecord({
          provider: 'warehouse',
          type: 'database_connection_string',
          safeMetadata: {
            region: 'br',
            priority: 1,
            enabled: true,
            nullable: null,
            password: 'must-not-leak',
            token: 'must-not-leak',
            secret: 'must-not-leak',
            authorization: 'Bearer must-not-leak',
          },
        }),
      ],
    });

    const result = await adapter.findByCredentialRef(TENANT_ID, CREDENTIAL_REF);

    expect(result.credential?.provider).toBe('warehouse');
    expect(result.credential?.type).toBe('database_connection_string');
    expect(result.credential?.safeMetadata).toEqual({
      region: 'br',
      priority: 1,
      enabled: true,
      nullable: null,
      provider: 'warehouse',
      status: 'active',
      type: 'database_connection_string',
    });
    expectSafeJson(result);
  });

  it('does not read protectedSecretValue, secretValue, or maskedPreview getters', async () => {
    const probe = createSecretProbe();
    const adapter = createAdapter({ records: [probe.record] });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result.found).toBe(true);
    expect(probe.reads()).toBe(0);
    expectSafeJson(result);
  });

  it('blocks credentialRef values that look like secrets', async () => {
    const adapter = createAdapter({
      records: [createCredentialRecord({ credentialRef: 'cred_token_secret_value' })],
    });

    const byConnection = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);
    const byRef = await adapter.findByCredentialRef(TENANT_ID, 'Bearer abcdefghijklmnopqrstuvwxyz');

    expect(byConnection).toMatchObject({
      found: false,
      blocker: {
        code: 'credential_ref_missing',
      },
    });
    expect(byRef).toMatchObject({
      found: false,
      blocker: {
        code: 'credential_ref_missing',
      },
    });
    expectSafeJson(byConnection);
    expectSafeJson(byRef);
  });

  it('blocks tenant mismatch when the dependency returns a record from another tenant', async () => {
    const dependency: RuntimeCredentialReferenceLookupDependency = {
      findByTenantAndConnection: jest.fn(async () => []),
      findByTenantAndCredentialRef: jest.fn(async () =>
        createCredentialRecord({ tenantId: OTHER_TENANT_ID }),
      ),
    };
    const adapter = new RuntimeCredentialReferenceSafeLookupAdapter(dependency);

    const result = await adapter.findByCredentialRef(TENANT_ID, CREDENTIAL_REF);

    expect(result).toMatchObject({
      found: false,
      blocker: {
        code: 'tenant_mismatch',
      },
    });
    expectSafeJson(result);
  });

  it('does not find credentials belonging to another tenant', async () => {
    const adapter = createAdapter({
      records: [createCredentialRecord({ tenantId: OTHER_TENANT_ID })],
    });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toMatchObject({
      found: false,
      blocker: {
        code: 'credential_ref_missing',
      },
    });
  });

  it('returns credential_ref_missing when there are zero active credentials', async () => {
    const adapter = createAdapter({ records: [] });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toMatchObject({
      found: false,
      blocker: {
        code: 'credential_ref_missing',
      },
    });
  });

  it('returns multiple_active_credentials_not_supported for multiple active credentials', async () => {
    const adapter = createAdapter({
      records: [
        createCredentialRecord(),
        createCredentialRecord({
          id: '662d4f6e7a1c2b00124f0402',
          credentialRef: 'cred_662d4f6e7a1c2b00124f0402',
        }),
      ],
    });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toMatchObject({
      found: false,
      blocker: {
        code: 'multiple_active_credentials_not_supported',
      },
    });
  });

  it.each(['revoked', 'inactive', 'disabled', 'archived', 'draft'])(
    'returns credential_ref_inactive for %s credentials',
    async (status) => {
      const adapter = createAdapter({
        records: [createCredentialRecord({ status })],
      });

      const byConnection = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);
      const byRef = await adapter.findByCredentialRef(TENANT_ID, CREDENTIAL_REF);

      expect(byConnection).toMatchObject({
        found: false,
        blocker: {
          code: 'credential_ref_inactive',
        },
      });
      expect(byRef).toMatchObject({
        found: false,
        blocker: {
          code: 'credential_ref_inactive',
        },
      });
      expectSafeJson(byConnection);
      expectSafeJson(byRef);
    },
  );

  it.each(['active', 'Active', 'ACTIVE'])('treats %s as active', async (status) => {
    const adapter = createAdapter({
      records: [createCredentialRecord({ status })],
    });

    const result = await adapter.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(result).toMatchObject({
      found: true,
      credential: {
        status,
      },
    });
  });

  it('returns credential_ref_missing when lookup by credentialRef does not find a record', async () => {
    const adapter = createAdapter({ records: [] });

    const result = await adapter.findByCredentialRef(TENANT_ID, CREDENTIAL_REF);

    expect(result).toMatchObject({
      found: false,
      blocker: {
        code: 'credential_ref_missing',
      },
    });
  });

  it('is deterministic for the same input and fake records', async () => {
    const first = createAdapter({ records: [createCredentialRecord()] });
    const second = createAdapter({ records: [createCredentialRecord()] });

    const firstResult = await first.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);
    const secondResult = await second.findActiveByTenantAndConnection(TENANT_ID, CONNECTION_ID);

    expect(firstResult).toEqual(secondResult);
  });

  it('does not import credential protector or call decrypt/protect methods', () => {
    const source = readFileSync(
      join(
        process.cwd(),
        'src/modules/runtime/bridge/adapters/runtime-credential-reference-safe-lookup.adapter.ts',
      ),
      'utf8',
    );

    expect(source).not.toContain('LocalCredentialProtectorService');
    expect(source).not.toMatch(/\.decrypt\s*\(/);
    expect(source).not.toMatch(/\.protect\s*\(/);
  });
});

function createAdapter(options: {
  readonly records: readonly RuntimeCredentialReferenceLookupRecord[];
}): RuntimeCredentialReferenceSafeLookupAdapter {
  const dependency: RuntimeCredentialReferenceLookupDependency = {
    findByTenantAndConnection: jest.fn(async (tenantId, connectionId) =>
      options.records.filter(
        (record) => record.tenantId === tenantId && record.connectionId === connectionId,
      ),
    ),
    findByTenantAndCredentialRef: jest.fn(
      async (tenantId, credentialRef) =>
        options.records.find(
          (record) => record.tenantId === tenantId && record.credentialRef === credentialRef,
        ) ?? null,
    ),
  };

  return new RuntimeCredentialReferenceSafeLookupAdapter(dependency);
}

function createCredentialRecord(
  overrides: Partial<RuntimeCredentialReferenceLookupRecord> = {},
): RuntimeCredentialReferenceLookupRecord {
  return {
    id: CREDENTIAL_ID,
    credentialRef: CREDENTIAL_REF,
    tenantId: TENANT_ID,
    connectionId: CONNECTION_ID,
    status: 'active',
    provider: 'customer-api',
    type: 'api_key',
    safeMetadata: {
      region: 'br',
    },
    ...overrides,
  };
}

function createSecretProbe(): {
  readonly record: RuntimeCredentialReferenceLookupRecord;
  readonly reads: () => number;
} {
  let reads = 0;
  const record = createCredentialRecord();

  Object.defineProperty(record, 'protectedSecretValue', {
    enumerable: true,
    get: () => {
      reads += 1;
      return 'must-not-leak';
    },
  });
  Object.defineProperty(record, 'secretValue', {
    enumerable: true,
    get: () => {
      reads += 1;
      return 'must-not-leak';
    },
  });
  Object.defineProperty(record, 'maskedPreview', {
    enumerable: true,
    get: () => {
      reads += 1;
      return '********demo';
    },
  });

  return {
    record,
    reads: () => reads,
  };
}

function expectSafeJson(value: unknown): void {
  const json = JSON.stringify(value).toLowerCase();

  [
    'protectedsecretvalue',
    'secretvalue',
    'maskedpreview',
    'password',
    'token',
    'secret',
    'authorization',
    'must-not-leak',
  ].forEach((fragment) => {
    expect(json).not.toContain(fragment);
  });
}
