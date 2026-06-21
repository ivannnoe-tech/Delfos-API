import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { SemanticModelsController } from './controllers/semantic-models.controller';
import { PostgresSemanticModelsRepository } from './repositories/postgres-semantic-models.repository';
import { SemanticModelsRepository } from './repositories/semantic-models.repository';
import { SemanticModelSanitizerService } from './services/semantic-model-sanitizer.service';
import { SemanticModelsService } from './services/semantic-models.service';

@Module({
  imports: [AuditModule],
  controllers: [SemanticModelsController],
  providers: [
    PostgresSemanticModelsRepository,
    { provide: SemanticModelsRepository, useExisting: PostgresSemanticModelsRepository },
    SemanticModelsService,
    SemanticModelSanitizerService,
  ],
  exports: [SemanticModelsService],
})
export class SemanticModelsModule {}
