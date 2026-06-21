import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { CredentialsController } from './controllers/credentials.controller';
import { CredentialsRepository } from './repositories/credentials.repository';
import { MongoCredentialsRepository } from './repositories/mongo-credentials.repository';
import { PostgresCredentialsRepository } from './repositories/postgres-credentials.repository';
import { Credential, CredentialSchema } from './schemas/credential.schema';
import { CredentialsService } from './services/credentials.service';
import { LocalCredentialProtectorService } from './services/local-credential-protector.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Credential.name, schema: CredentialSchema }]),
    AuditModule,
  ],
  controllers: [CredentialsController],
  providers: [
    MongoCredentialsRepository,
    PostgresCredentialsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: CredentialsRepository,
      inject: [AppConfigService, MongoCredentialsRepository, PostgresCredentialsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoCredentialsRepository,
        postgres: PostgresCredentialsRepository,
      ): CredentialsRepository => (config.postgresUrl ? postgres : mongo),
    },
    CredentialsService,
    LocalCredentialProtectorService,
  ],
  exports: [CredentialsService],
})
export class CredentialsModule {}
