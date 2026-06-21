import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsModule } from '../dashboard-definitions/dashboard-definitions.module';
import { DatasetsModule } from '../datasets/datasets.module';
import { FieldMappingsModule } from '../field-mappings/field-mappings.module';
import { QueryDefinitionsModule } from '../query-definitions/query-definitions.module';
import { ReportDefinitionsModule } from '../report-definitions/report-definitions.module';
import { ExecutionRequestsController } from './controllers/execution-requests.controller';
import { PostgresExecutionRequestEventsRepository } from './repositories/postgres-execution-request-events.repository';
import { PostgresExecutionRequestsRepository } from './repositories/postgres-execution-requests.repository';
import { ExecutionRequestEventsRepository } from './repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from './repositories/execution-requests.repository';
import { ExecutionRequestAuditService } from './services/execution-request-audit.service';
import { ExecutionRequestDemoExecutorService } from './services/execution-request-demo-executor.service';
import { ExecutionRequestDryRunService } from './services/execution-request-dry-run.service';
import { ExecutionRequestEventsService } from './services/execution-request-events.service';
import { ExecutionRequestReadinessService } from './services/execution-request-readiness.service';
import { ExecutionRequestsService } from './services/execution-requests.service';

@Module({
  imports: [
    AuditModule,
    QueryDefinitionsModule,
    DashboardDefinitionsModule,
    ReportDefinitionsModule,
    DatasetsModule,
    FieldMappingsModule,
  ],
  controllers: [ExecutionRequestsController],
  providers: [
    PostgresExecutionRequestsRepository,
    {
      provide: ExecutionRequestsRepository,
      useExisting: PostgresExecutionRequestsRepository,
    },
    PostgresExecutionRequestEventsRepository,
    {
      provide: ExecutionRequestEventsRepository,
      useExisting: PostgresExecutionRequestEventsRepository,
    },
    ExecutionRequestAuditService,
    ExecutionRequestDemoExecutorService,
    ExecutionRequestDryRunService,
    ExecutionRequestEventsService,
    ExecutionRequestReadinessService,
    ExecutionRequestsService,
  ],
  exports: [ExecutionRequestsService],
})
export class RuntimeModule {}
