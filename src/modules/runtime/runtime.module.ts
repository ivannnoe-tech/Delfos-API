import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsModule } from '../dashboard-definitions/dashboard-definitions.module';
import { DatasetsModule } from '../datasets/datasets.module';
import { FieldMappingsModule } from '../field-mappings/field-mappings.module';
import { QueryDefinitionsModule } from '../query-definitions/query-definitions.module';
import { ReportDefinitionsModule } from '../report-definitions/report-definitions.module';
import { ExecutionRequestsController } from './controllers/execution-requests.controller';
import { ExecutionRequestEventsRepository } from './repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from './repositories/execution-requests.repository';
import { ExecutionRequest, ExecutionRequestSchema } from './schemas/execution-request.schema';
import {
  ExecutionRequestEvent,
  ExecutionRequestEventSchema,
} from './schemas/execution-request-event.schema';
import { ExecutionRequestsService } from './services/execution-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExecutionRequest.name, schema: ExecutionRequestSchema },
      { name: ExecutionRequestEvent.name, schema: ExecutionRequestEventSchema },
    ]),
    AuditModule,
    QueryDefinitionsModule,
    DashboardDefinitionsModule,
    ReportDefinitionsModule,
    DatasetsModule,
    FieldMappingsModule,
  ],
  controllers: [ExecutionRequestsController],
  providers: [
    ExecutionRequestEventsRepository,
    ExecutionRequestsRepository,
    ExecutionRequestsService,
  ],
  exports: [ExecutionRequestsService],
})
export class RuntimeModule {}
