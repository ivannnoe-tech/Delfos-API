import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsController } from './controllers/dashboard-definitions.controller';
import { DashboardDefinitionsRepository } from './repositories/dashboard-definitions.repository';
import { PostgresDashboardDefinitionsRepository } from './repositories/postgres-dashboard-definitions.repository';
import { DashboardDefinitionSanitizerService } from './services/dashboard-definition-sanitizer.service';
import { DashboardDefinitionsService } from './services/dashboard-definitions.service';

@Module({
  imports: [AuditModule],
  controllers: [DashboardDefinitionsController],
  providers: [
    PostgresDashboardDefinitionsRepository,
    {
      provide: DashboardDefinitionsRepository,
      useExisting: PostgresDashboardDefinitionsRepository,
    },
    DashboardDefinitionsService,
    DashboardDefinitionSanitizerService,
  ],
  exports: [DashboardDefinitionsService],
})
export class DashboardDefinitionsModule {}
