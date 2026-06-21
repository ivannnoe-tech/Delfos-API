import { AppConfigService } from '../../../config/app-config.service';
import {
  CredentialsRepository,
  CredentialSecretMaterial,
} from '../repositories/credentials.repository';
import { CredentialStatus } from '../schemas/credential.constants';
import {
  CredentialBrokerError,
  CredentialBrokerService,
} from '../services/credential-broker.service';
import { LocalCredentialDecryptorService } from '../services/local-credential-decryptor.service';
import { LocalCredentialProtectorService } from '../services/local-credential-protector.service';

const TENANT = '11111111-1111-1111-1111-111111111111';
const CRED_ID = '22222222-2222-2222-2222-222222222222';
const CREDENTIAL_REF = `cred_${CRED_ID}`;

function createConfig(): AppConfigService {
  return {
    get encryptionKeyBase64(): string {
      return Buffer.alloc(32, 7).toString('base64');
    },
  } as AppConfigService;
}

const protector = new LocalCredentialProtectorService(createConfig());

function material(
  secret: string,
  overrides: Partial<CredentialSecretMaterial> = {},
): CredentialSecretMaterial {
  const protectedValue = protector.protect(secret);
  return {
    id: CRED_ID,
    tenantId: TENANT,
    status: CredentialStatus.Active,
    protectionProvider: protectedValue.provider,
    protectedSecretValue: protectedValue.protectedValue,
    ...overrides,
  };
}

function createBroker(materialResult: CredentialSecretMaterial | null) {
  const findSecretMaterialByTenantAndId = jest.fn(async () => materialResult);
  const repository = {
    findSecretMaterialByTenantAndId,
  } as unknown as CredentialsRepository;
  const broker = new CredentialBrokerService(
    repository,
    new LocalCredentialDecryptorService(createConfig()),
  );
  return { broker, findSecretMaterialByTenantAndId };
}

describe('CredentialBrokerService', () => {
  it('resolves and decrypts an active credential to a usable secret, scoped by tenant', async () => {
    const { broker, findSecretMaterialByTenantAndId } = createBroker(
      material('customer-secret-1234'),
    );

    const resolved = await broker.resolveSecret(TENANT, CREDENTIAL_REF);

    expect(findSecretMaterialByTenantAndId).toHaveBeenCalledWith(TENANT, CRED_ID);
    expect(resolved.use((secret) => secret)).toBe('customer-secret-1234');
  });

  it('rejects a credentialRef without the cred_ prefix without touching the store', async () => {
    const { broker, findSecretMaterialByTenantAndId } = createBroker(null);

    await expect(broker.resolveSecret(TENANT, 'not-a-ref')).rejects.toBeInstanceOf(
      CredentialBrokerError,
    );
    expect(findSecretMaterialByTenantAndId).not.toHaveBeenCalled();
  });

  it('rejects when the credential is not found for the tenant', async () => {
    const { broker } = createBroker(null);

    await expect(broker.resolveSecret(TENANT, CREDENTIAL_REF)).rejects.toMatchObject({
      code: 'credential_not_found',
    });
  });

  it('rejects when the credential is not active', async () => {
    const { broker } = createBroker(material('x-secret', { status: CredentialStatus.Revoked }));

    await expect(broker.resolveSecret(TENANT, CREDENTIAL_REF)).rejects.toMatchObject({
      code: 'credential_inactive',
    });
  });

  it('wraps a decryption failure in a safe broker error without leaking detail', async () => {
    const { broker } = createBroker(
      material('y-secret', { protectedSecretValue: 'local:v1:bad:bad:bad' }),
    );

    await expect(broker.resolveSecret(TENANT, CREDENTIAL_REF)).rejects.toMatchObject({
      code: 'credential_decrypt_failed',
    });
  });

  it('never lets the resolved secret serialize its plaintext', async () => {
    const { broker } = createBroker(material('do-not-leak-broker'));

    const resolved = await broker.resolveSecret(TENANT, CREDENTIAL_REF);

    expect(JSON.stringify({ resolved })).not.toContain('do-not-leak-broker');
  });
});
