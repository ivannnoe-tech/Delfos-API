import { AppConfigService } from '../../../config/app-config.service';
import {
  LocalCredentialProtectorService,
  maskSecret,
} from '../services/local-credential-protector.service';

describe('LocalCredentialProtectorService', () => {
  it('protects a secret without storing the raw value in the protected representation', () => {
    const service = new LocalCredentialProtectorService(createConfig());
    const secretValue = 'local-test-secret-value-1234';

    const result = service.protect(secretValue);

    expect(result.provider).toBe('local_aes_256_gcm');
    expect(result.maskedPreview).toBe('********1234');
    expect(result.protectedValue).toContain('local:v1:');
    expect(result.protectedValue).not.toContain(secretValue);
  });

  it('does not generate masked preview for short values', () => {
    expect(maskSecret('abc123')).toBeNull();
  });
});

function createConfig(): AppConfigService {
  return {
    get encryptionKeyBase64(): string {
      return Buffer.alloc(32, 7).toString('base64');
    },
  } as AppConfigService;
}
