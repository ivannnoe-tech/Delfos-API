import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsController } from './controllers/dashboard-definitions.controller';
import { DashboardDefinitionsRepository } from './repositories/dashboard-definitions.repository';
import { MongoDashboardDefinitionsRepository } from './repositories/mongo-dashboard-definitions.repository';
import { PostgresDashboardDefinitionsRepository } from './repositories/postgres-dashboard-definitions.repository';
import {
  DashboardDefinition,
  DashboardDefinitionSchema,
} from './schemas/dashboard-definition.schema';
import { DashboardDefinitionSanitizerService } from './services/dashboard-definition-sanitizer.service';
import { DashboardDefinitionsService } from './services/dashboard-definitions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DashboardDefinition.name, schema: DashboardDefinitionSchema },
    ]),
    AuditModule,
  ],
  controllers: [DashboardDefinitionsController],
  providers: [
    MongoDashboardDefinitionsRepository,
    PostgresDashboardDefinitionsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: DashboardDefinitionsRepository,
      inject: [
        AppConfigService,
        MongoDashboardDefinitionsRepository,
        PostgresDashboardDefinitionsRepository,
      ],
      useFactory: (
        config: AppConfigService,
        mongo: MongoDashboardDefinitionsRepository,
        postgres: PostgresDashboardDefinitionsRepository,
      ): DashboardDefinitionsRepository => (config.postgresUrl ? postgres : mongo),
    },
    DashboardDefinitionsService,
    DashboardDefinitionSanitizerService,
  ],
  exports: [DashboardDefinitionsService],
})
export class DashboardDefinitionsModule {}
