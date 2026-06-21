import { AppConfigService } from '../../../config/app-config.service';
import {
  CredentialDecryptionError,
  LocalCredentialDecryptorService,
} from '../services/local-credential-decryptor.service';
import { LocalCredentialProtectorService } from '../services/local-credential-protector.service';

function createConfig(): AppConfigService {
  return {
    get encryptionKeyBase64(): string {
      return Buffer.alloc(32, 7).toString('base64');
    },
  } as AppConfigService;
}

describe('LocalCredentialDecryptorService', () => {
  const config = createConfig();
  const protector = new LocalCredentialProtectorService(config);
  const decryptor = new LocalCredentialDecryptorService(config);

  it('round-trips a value protected by LocalCredentialProtectorService', () => {
    const secret = 'customer-db-password-9999';
    const protectedValue = protector.protect(secret);

    const plaintext = decryptor.reveal(protectedValue.provider, protectedValue.protectedValue);

    expect(plaintext.toString('utf8')).toBe(secret);
  });

  it('rejects an unsupported protection provider', () => {
    const protectedValue = protector.protect('some-secret-value');

    expect(() => decryptor.reveal('kms_v2', protectedValue.protectedValue)).toThrow(
      CredentialDecryptionError,
    );
  });

  it('rejects a malformed envelope', () => {
    expect(() => decryptor.reveal('local_aes_256_gcm', 'not-an-envelope')).toThrow(
      CredentialDecryptionError,
    );
  });

  it('fails authentication on a tampered ciphertext', () => {
    const protectedValue = protector.protect('tamper-me-please');
    const parts = protectedValue.protectedValue.split(':');
    const ciphertext = Buffer.from(parts[4], 'base64');
    ciphertext[0] = ciphertext[0] ^ 0xff;
    parts[4] = ciphertext.toString('base64');

    expect(() => decryptor.reveal('local_aes_256_gcm', parts.join(':'))).toThrow(
      CredentialDecryptionError,
    );
  });

  it('surfaces only a safe code, never the key or ciphertext, on failure', () => {
    let message = '';
    try {
      decryptor.reveal('local_aes_256_gcm', 'local:v1:AAAA:BBBB:CCCC');
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toBe('decryption_failed');
  });
});
