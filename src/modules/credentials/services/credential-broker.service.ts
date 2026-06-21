import { Injectable } from '@nestjs/common';

import { CredentialsRepository } from '../repositories/credentials.repository';
import { CredentialStatus } from '../schemas/credential.constants';
import { LocalCredentialDecryptorService } from './local-credential-decryptor.service';
import { ResolvedSecret } from './resolved-secret';

const CREDENTIAL_REF_PREFIX = 'cred_';

export const CREDENTIAL_BROKER = Symbol('CREDENTIAL_BROKER');

/**
 * Resolves a `credentialRef` to a usable, request-scoped plaintext secret
 * just-in-time (ADR-0037). delfos-api owns the encryption/store; the secret is
 * returned only as a zeroizable {@link ResolvedSecret} and must never be
 * persisted, cached, logged or surfaced to a caller.
 */
export interface CredentialBrokerPort {
  resolveSecret(tenantId: string, credentialRef: string): Promise<ResolvedSecret>;
}

/** Safe, detail-free error for broker failures (no secret material in message). */
export class CredentialBrokerError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'CredentialBrokerError';
  }
}

@Injectable()
export class CredentialBrokerService implements CredentialBrokerPort {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly decryptor: LocalCredentialDecryptorService,
  ) {}

  async resolveSecret(tenantId: string, credentialRef: string): Promise<ResolvedSecret> {
    const id = this.parseCredentialRef(credentialRef);
    if (!tenantId || !id) {
      throw new CredentialBrokerError('credential_ref_invalid');
    }

    const material = await this.credentialsRepository.findSecretMaterialByTenantAndId(tenantId, id);
    if (!material) {
      throw new CredentialBrokerError('credential_not_found');
    }

    if (material.status !== CredentialStatus.Active) {
      throw new CredentialBrokerError('credential_inactive');
    }

    let plaintext: Buffer;
    try {
      plaintext = this.decryptor.reveal(material.protectionProvider, material.protectedSecretValue);
    } catch {
      // Wrap any decryptor failure: never surface the underlying detail.
      throw new CredentialBrokerError('credential_decrypt_failed');
    }

    return ResolvedSecret.fromBuffer(plaintext);
  }

  private parseCredentialRef(credentialRef: string): string | null {
    if (typeof credentialRef !== 'string' || !credentialRef.startsWith(CREDENTIAL_REF_PREFIX)) {
      return null;
    }

    const id = credentialRef.slice(CREDENTIAL_REF_PREFIX.length);
    return id.length > 0 ? id : null;
  }
}
