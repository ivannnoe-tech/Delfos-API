import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { QueryDefinitionsController } from './controllers/query-definitions.controller';
import { MongoQueryDefinitionsRepository } from './repositories/mongo-query-definitions.repository';
import { PostgresQueryDefinitionsRepository } from './repositories/postgres-query-definitions.repository';
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
  providers: [
    MongoQueryDefinitionsRepository,
    PostgresQueryDefinitionsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: QueryDefinitionsRepository,
      inject: [
        AppConfigService,
        MongoQueryDefinitionsRepository,
        PostgresQueryDefinitionsRepository,
      ],
      useFactory: (
        config: AppConfigService,
        mongo: MongoQueryDefinitionsRepository,
        postgres: PostgresQueryDefinitionsRepository,
      ): QueryDefinitionsRepository => (config.postgresUrl ? postgres : mongo),
    },
    QueryDefinitionsService,
    QueryDefinitionSanitizerService,
  ],
  exports: [QueryDefinitionsService],
})
export class QueryDefinitionsModule {}
