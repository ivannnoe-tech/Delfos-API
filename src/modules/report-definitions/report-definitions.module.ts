import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { ReportDefinitionsController } from './controllers/report-definitions.controller';
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
    ReportDefinitionsRepository,
    ReportDefinitionsService,
    ReportDefinitionSanitizerService,
  ],
  exports: [ReportDefinitionsService],
})
export class ReportDefinitionsModule {}
