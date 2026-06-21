import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { QueryDefinitionsController } from './controllers/query-definitions.controller';
import { PostgresQueryDefinitionsRepository } from './repositories/postgres-query-definitions.repository';
import { QueryDefinitionsRepository } from './repositories/query-definitions.repository';
import { QueryDefinitionSanitizerService } from './services/query-definition-sanitizer.service';
import { QueryDefinitionsService } from './services/query-definitions.service';

@Module({
  imports: [AuditModule],
  controllers: [QueryDefinitionsController],
  providers: [
    PostgresQueryDefinitionsRepository,
    { provide: QueryDefinitionsRepository, useExisting: PostgresQueryDefinitionsRepository },
    QueryDefinitionsService,
    QueryDefinitionSanitizerService,
  ],
  exports: [QueryDefinitionsService],
})
export class QueryDefinitionsModule {}
