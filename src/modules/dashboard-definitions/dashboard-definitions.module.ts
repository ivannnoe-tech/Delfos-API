import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { DashboardDefinitionsController } from './controllers/dashboard-definitions.controller';
import { DashboardDefinitionsRepository } from './repositories/dashboard-definitions.repository';
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
    DashboardDefinitionsRepository,
    DashboardDefinitionsService,
    DashboardDefinitionSanitizerService,
  ],
  exports: [DashboardDefinitionsService],
})
export class DashboardDefinitionsModule {}
