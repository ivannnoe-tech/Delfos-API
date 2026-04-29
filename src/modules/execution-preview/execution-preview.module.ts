import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsModule } from '../dashboard-definitions/dashboard-definitions.module';
import { QueryDefinitionsModule } from '../query-definitions/query-definitions.module';
import { ExecutionPreviewController } from './controllers/execution-preview.controller';
import { DemoDashboardPreviewGeneratorService } from './services/demo-dashboard-preview-generator.service';
import { DemoQueryPreviewGeneratorService } from './services/demo-query-preview-generator.service';
import { ExecutionPreviewService } from './services/execution-preview.service';

@Module({
  imports: [AuditModule, QueryDefinitionsModule, DashboardDefinitionsModule],
  controllers: [ExecutionPreviewController],
  providers: [
    DemoQueryPreviewGeneratorService,
    DemoDashboardPreviewGeneratorService,
    ExecutionPreviewService,
  ],
})
export class ExecutionPreviewModule {}
