import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CredentialsController } from './controllers/credentials.controller';
import { CredentialsRepository } from './repositories/credentials.repository';
import { PostgresCredentialsRepository } from './repositories/postgres-credentials.repository';
import { CREDENTIAL_BROKER, CredentialBrokerService } from './services/credential-broker.service';
import { CredentialsService } from './services/credentials.service';
import { LocalCredentialDecryptorService } from './services/local-credential-decryptor.service';
import { LocalCredentialProtectorService } from './services/local-credential-protector.service';

@Module({
  imports: [AuditModule],
  controllers: [CredentialsController],
  providers: [
    PostgresCredentialsRepository,
    { provide: CredentialsRepository, useExisting: PostgresCredentialsRepository },
    CredentialsService,
    LocalCredentialProtectorService,
    // Phase 2 credential broker (ADR-0037): real just-in-time decryption.
    // Built and exported as a real capability, but NOT yet consumed by the
    // runtime/dispatch flow (no real dispatch to deliver the secret to yet).
    LocalCredentialDecryptorService,
    CredentialBrokerService,
    { provide: CREDENTIAL_BROKER, useExisting: CredentialBrokerService },
  ],
  exports: [CredentialsService, CredentialBrokerService, CREDENTIAL_BROKER],
})
export class CredentialsModule {}
