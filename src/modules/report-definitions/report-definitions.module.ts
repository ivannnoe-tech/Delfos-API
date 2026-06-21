import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { ReportDefinitionsController } from './controllers/report-definitions.controller';
import { MongoReportDefinitionsRepository } from './repositories/mongo-report-definitions.repository';
import { PostgresReportDefinitionsRepository } from './repositories/postgres-report-definitions.repository';
import { ReportDefinitionsRepository } from './repositories/report-definitions.repository';
import { ReportDefinition, ReportDefinitionSchema } from './schemas/report-definition.schema';
import { ReportDefinitionSanitizerService } from './services/report-definition-sanitizer.service';
import { ReportDefinitionsService } from './services/report-definitions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReportDefinition.name, schema: ReportDefinitionSchema }]),
    AuditModule,
  ],
  controllers: [ReportDefinitionsController],
  providers: [
    MongoReportDefinitionsRepository,
    PostgresReportDefinitionsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: ReportDefinitionsRepository,
      inject: [
        AppConfigService,
        MongoReportDefinitionsRepository,
        PostgresReportDefinitionsRepository,
      ],
      useFactory: (
        config: AppConfigService,
        mongo: MongoReportDefinitionsRepository,
        postgres: PostgresReportDefinitionsRepository,
      ): ReportDefinitionsRepository => (config.postgresUrl ? postgres : mongo),
    },
    ReportDefinitionsService,
    ReportDefinitionSanitizerService,
  ],
  exports: [ReportDefinitionsService],
})
export class ReportDefinitionsModule {}
