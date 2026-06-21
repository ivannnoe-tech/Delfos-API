import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ConnectionsModule } from '../connections/connections.module';
import { ConnectionsService } from '../connections/services/connections.service';
import { CredentialsModule } from '../credentials/credentials.module';
import { CredentialsService } from '../credentials/services/credentials.service';
import { DashboardDefinitionsModule } from '../dashboard-definitions/dashboard-definitions.module';
import { DashboardDefinitionsService } from '../dashboard-definitions/services/dashboard-definitions.service';
import { DatasetsModule } from '../datasets/datasets.module';
import { DatasetsService } from '../datasets/services/datasets.service';
import { FieldMappingsModule } from '../field-mappings/field-mappings.module';
import { FieldMappingsService } from '../field-mappings/services/field-mappings.service';
import { QueryDefinitionsModule } from '../query-definitions/query-definitions.module';
import { QueryDefinitionsService } from '../query-definitions/services/query-definitions.service';
import { ReportDefinitionsModule } from '../report-definitions/report-definitions.module';
import { ReportDefinitionsService } from '../report-definitions/services/report-definitions.service';
import { AppConfigService } from '../../config/app-config.service';
import { createRuntimeConnectorBridgeResolver } from './bridge/runtime-connector-bridge-resolver.factory';
import { ExecutionRequestsController } from './controllers/execution-requests.controller';
import {
  CONNECTOR_DISPATCH_TRANSPORT,
  NodeHttpsConnectorDispatchTransport,
} from './dispatch/connector-dispatch-transport';
import { HttpConnectorDispatchAdapter } from './dispatch/http-connector-dispatch.adapter';
import { PostgresExecutionRequestEventsRepository } from './repositories/postgres-execution-request-events.repository';
import { PostgresExecutionRequestsRepository } from './repositories/postgres-execution-requests.repository';
import { ExecutionRequestEventsRepository } from './repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from './repositories/execution-requests.repository';
import { ConnectorBridgeEventRecorder } from './services/connector-bridge-event-recorder';
import {
  CONNECTOR_BRIDGE_EVENT_RECORDER,
  CONNECTOR_DISPATCH_PORT,
  ConnectorCommandPreparationService,
  RUNTIME_CONNECTOR_BRIDGE_RESOLVER,
} from './services/connector-command-preparation.service';
import { ExecutionRequestAuditService } from './services/execution-request-audit.service';
import { ExecutionRequestDemoExecutorService } from './services/execution-request-demo-executor.service';
import { ExecutionRequestDryRunService } from './services/execution-request-dry-run.service';
import { ExecutionRequestEventsService } from './services/execution-request-events.service';
import { ExecutionRequestReadinessService } from './services/execution-request-readiness.service';
import { ExecutionRequestsService } from './services/execution-requests.service';
import { RuntimeReadinessEvaluatorAdapter } from './services/runtime-readiness-evaluator.adapter';

@Module({
  imports: [
    AuditModule,
    QueryDefinitionsModule,
    DashboardDefinitionsModule,
    ReportDefinitionsModule,
    DatasetsModule,
    FieldMappingsModule,
    ConnectionsModule,
    CredentialsModule,
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
    // Phase 2, 1st increment (ADR-0037 / ADR-0038): wire the runtime connector
    // bridge command-preparation as a real, audited capability. No decryption,
    // dispatch or external call — only an in-memory command shape is prepared
    // and validated, and safe events are recorded on the timeline.
    RuntimeReadinessEvaluatorAdapter,
    {
      provide: CONNECTOR_BRIDGE_EVENT_RECORDER,
      useClass: ConnectorBridgeEventRecorder,
    },
    {
      provide: CONNECTOR_DISPATCH_TRANSPORT,
      useFactory: (config: AppConfigService) => new NodeHttpsConnectorDispatchTransport(config),
      inject: [AppConfigService],
    },
    {
      // Phase 2 dispatch transport (ADR-0038): real HTTP + mTLS adapter, OFF by
      // default (CONNECTOR_DISPATCH_ENABLED=false). When disabled it returns
      // not_supported with no external call and no secret resolution; when
      // enabled it resolves the secret just-in-time and sends it only on the
      // mTLS channel for this dispatch.
      provide: CONNECTOR_DISPATCH_PORT,
      useClass: HttpConnectorDispatchAdapter,
    },
    {
      provide: RUNTIME_CONNECTOR_BRIDGE_RESOLVER,
      useFactory: (
        queryDefinitions: QueryDefinitionsService,
        dashboardDefinitions: DashboardDefinitionsService,
        reportDefinitions: ReportDefinitionsService,
        datasets: DatasetsService,
        fieldMappings: FieldMappingsService,
        connections: ConnectionsService,
        credentials: CredentialsService,
        executionRequestReader: ExecutionRequestsRepository,
        readinessEvaluator: RuntimeReadinessEvaluatorAdapter,
      ) =>
        createRuntimeConnectorBridgeResolver({
          queryDefinitions,
          dashboardDefinitions,
          reportDefinitions,
          datasets,
          fieldMappings,
          connections,
          credentials,
          executionRequestReader,
          readinessEvaluator,
        }),
      inject: [
        QueryDefinitionsService,
        DashboardDefinitionsService,
        ReportDefinitionsService,
        DatasetsService,
        FieldMappingsService,
        ConnectionsService,
        CredentialsService,
        ExecutionRequestsRepository,
        RuntimeReadinessEvaluatorAdapter,
      ],
    },
    ConnectorCommandPreparationService,
  ],
  exports: [ExecutionRequestsService, ConnectorCommandPreparationService],
})
export class RuntimeModule {}
