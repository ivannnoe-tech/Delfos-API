import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { CredentialsController } from './controllers/credentials.controller';
import { CredentialsRepository } from './repositories/credentials.repository';
import { Credential, CredentialSchema } from './schemas/credential.schema';
import { CredentialsService } from './services/credentials.service';
import { LocalCredentialProtectorService } from './services/local-credential-protector.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Credential.name, schema: CredentialSchema }]),
    AuditModule,
  ],
  controllers: [CredentialsController],
  providers: [CredentialsRepository, CredentialsService, LocalCredentialProtectorService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
