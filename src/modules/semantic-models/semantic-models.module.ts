import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { SemanticModelsController } from './controllers/semantic-models.controller';
import { MongoSemanticModelsRepository } from './repositories/mongo-semantic-models.repository';
import { PostgresSemanticModelsRepository } from './repositories/postgres-semantic-models.repository';
import { SemanticModelsRepository } from './repositories/semantic-models.repository';
import { SemanticModel, SemanticModelSchema } from './schemas/semantic-model.schema';
import { SemanticModelSanitizerService } from './services/semantic-model-sanitizer.service';
import { SemanticModelsService } from './services/semantic-models.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SemanticModel.name, schema: SemanticModelSchema }]),
    AuditModule,
  ],
  controllers: [SemanticModelsController],
  providers: [
    MongoSemanticModelsRepository,
    PostgresSemanticModelsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: SemanticModelsRepository,
      inject: [AppConfigService, MongoSemanticModelsRepository, PostgresSemanticModelsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoSemanticModelsRepository,
        postgres: PostgresSemanticModelsRepository,
      ): SemanticModelsRepository => (config.postgresUrl ? postgres : mongo),
    },
    SemanticModelsService,
    SemanticModelSanitizerService,
  ],
  exports: [SemanticModelsService],
})
export class SemanticModelsModule {}
