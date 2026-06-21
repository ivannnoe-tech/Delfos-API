import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CredentialsController } from './controllers/credentials.controller';
import { CredentialsRepository } from './repositories/credentials.repository';
import { PostgresCredentialsRepository } from './repositories/postgres-credentials.repository';
import { CredentialsService } from './services/credentials.service';
import { LocalCredentialProtectorService } from './services/local-credential-protector.service';

@Module({
  imports: [AuditModule],
  controllers: [CredentialsController],
  providers: [
    PostgresCredentialsRepository,
    { provide: CredentialsRepository, useExisting: PostgresCredentialsRepository },
    CredentialsService,
    LocalCredentialProtectorService,
  ],
  exports: [CredentialsService],
})
export class CredentialsModule {}
