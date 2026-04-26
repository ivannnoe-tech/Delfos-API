import { Injectable } from '@nestjs/common';
import { createCipheriv, randomBytes } from 'node:crypto';

import { AppConfigService } from '../../../config/app-config.service';

export interface ProtectedCredentialValue {
  protectedValue: string;
  provider: string;
  maskedPreview: string | null;
}

@Injectable()
export class LocalCredentialProtectorService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly provider = 'local_aes_256_gcm';

  constructor(private readonly config: AppConfigService) {}

  protect(secretValue: string): ProtectedCredentialValue {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      LocalCredentialProtectorService.algorithm,
      this.encryptionKey,
      iv,
    );
    const ciphertext = Buffer.concat([cipher.update(secretValue, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      protectedValue: [
        'local',
        'v1',
        iv.toString('base64'),
        tag.toString('base64'),
        ciphertext.toString('base64'),
      ].join(':'),
      provider: LocalCredentialProtectorService.provider,
      maskedPreview: maskSecret(secretValue),
    };
  }

  private get encryptionKey(): Buffer {
    return Buffer.from(this.config.encryptionKeyBase64, 'base64');
  }
}

export function maskSecret(secretValue: string): string | null {
  const normalizedValue = secretValue.trim();

  if (normalizedValue.length < 8) {
    return null;
  }

  return `********${normalizedValue.slice(-4)}`;
}
