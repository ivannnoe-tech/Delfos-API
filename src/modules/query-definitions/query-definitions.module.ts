import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { QueryDefinitionsController } from './controllers/query-definitions.controller';
import { QueryDefinitionsRepository } from './repositories/query-definitions.repository';
import { QueryDefinition, QueryDefinitionSchema } from './schemas/query-definition.schema';
import { QueryDefinitionSanitizerService } from './services/query-definition-sanitizer.service';
import { QueryDefinitionsService } from './services/query-definitions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: QueryDefinition.name, schema: QueryDefinitionSchema }]),
    AuditModule,
  ],
  controllers: [QueryDefinitionsController],
  providers: [QueryDefinitionsRepository, QueryDefinitionsService, QueryDefinitionSanitizerService],
  exports: [QueryDefinitionsService],
})
export class QueryDefinitionsModule {}
