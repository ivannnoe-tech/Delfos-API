import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ReportDefinitionsController } from './controllers/report-definitions.controller';
import { PostgresReportDefinitionsRepository } from './repositories/postgres-report-definitions.repository';
import { ReportDefinitionsRepository } from './repositories/report-definitions.repository';
import { ReportDefinitionSanitizerService } from './services/report-definition-sanitizer.service';
import { ReportDefinitionsService } from './services/report-definitions.service';

@Module({
  imports: [AuditModule],
  controllers: [ReportDefinitionsController],
  providers: [
    PostgresReportDefinitionsRepository,
    { provide: ReportDefinitionsRepository, useExisting: PostgresReportDefinitionsRepository },
    ReportDefinitionsService,
    ReportDefinitionSanitizerService,
  ],
  exports: [ReportDefinitionsService],
})
export class ReportDefinitionsModule {}
