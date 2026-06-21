import { Module } from '@nestjs/common';

import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { PostgresAuditLogsRepository } from './repositories/postgres-audit-logs.repository';
import { AuditService } from './services/audit.service';

@Module({
  providers: [
    PostgresAuditLogsRepository,
    { provide: AuditLogsRepository, useExisting: PostgresAuditLogsRepository },
    AuditService,
  ],
  exports: [AuditService],
})
export class AuditModule {}
