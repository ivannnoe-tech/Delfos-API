import { Injectable } from '@nestjs/common';
import { createDecipheriv } from 'node:crypto';

import { AppConfigService } from '../../../config/app-config.service';

/**
 * Safe, detail-free error for any credential decryption failure. The message is
 * a stable code only — it never carries the key, ciphertext or any secret
 * material (ADR-0037 redaction invariant).
 */
export class CredentialDecryptionError extends Error {
  constructor(code: string) {
    super(code);
    this.name = 'CredentialDecryptionError';
  }
}

/**
 * Inverse of {@link LocalCredentialProtectorService.protect}: decrypts the
 * `local:v1:<iv>:<tag>:<ciphertext>` AES-256-GCM envelope using
 * `ENCRYPTION_KEY_BASE64` (ADR-0019 key, owned by delfos-api). Returns the
 * plaintext as a Buffer so the caller can wrap it in a zeroizable
 * {@link ResolvedSecret}. Any malformed input, unsupported provider or
 * authentication failure throws a {@link CredentialDecryptionError} with a safe
 * code only.
 */
@Injectable()
export class LocalCredentialDecryptorService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly provider = 'local_aes_256_gcm';
  private static readonly scheme = 'local';
  private static readonly version = 'v1';

  constructor(private readonly config: AppConfigService) {}

  reveal(protectionProvider: string, protectedValue: string): Buffer {
    if (protectionProvider !== LocalCredentialDecryptorService.provider) {
      throw new CredentialDecryptionError('unsupported_protection_provider');
    }

    const parts = protectedValue.split(':');
    if (
      parts.length !== 5 ||
      parts[0] !== LocalCredentialDecryptorService.scheme ||
      parts[1] !== LocalCredentialDecryptorService.version
    ) {
      throw new CredentialDecryptionError('invalid_protected_value_format');
    }

    const iv = Buffer.from(parts[2], 'base64');
    const authTag = Buffer.from(parts[3], 'base64');
    const ciphertext = Buffer.from(parts[4], 'base64');

    try {
      const decipher = createDecipheriv(
        LocalCredentialDecryptorService.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      // Swallow the underlying crypto error: it could carry detail. Only a safe
      // code escapes.
      throw new CredentialDecryptionError('decryption_failed');
    }
  }

  private get encryptionKey(): Buffer {
    return Buffer.from(this.config.encryptionKeyBase64, 'base64');
  }
}
