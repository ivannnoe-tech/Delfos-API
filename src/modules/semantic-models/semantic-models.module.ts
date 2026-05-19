import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { SemanticModelsController } from './controllers/semantic-models.controller';
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
  providers: [SemanticModelsRepository, SemanticModelsService, SemanticModelSanitizerService],
  exports: [SemanticModelsService],
})
export class SemanticModelsModule {}
