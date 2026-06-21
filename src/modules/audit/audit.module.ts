import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { MongoAuditLogsRepository } from './repositories/mongo-audit-logs.repository';
import { PostgresAuditLogsRepository } from './repositories/postgres-audit-logs.repository';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditService } from './services/audit.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [
    MongoAuditLogsRepository,
    PostgresAuditLogsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: AuditLogsRepository,
      inject: [AppConfigService, MongoAuditLogsRepository, PostgresAuditLogsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoAuditLogsRepository,
        postgres: PostgresAuditLogsRepository,
      ): AuditLogsRepository => (config.postgresUrl ? postgres : mongo),
    },
    AuditService,
  ],
  exports: [AuditService],
})
export class AuditModule {}
