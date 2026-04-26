import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { DatasetsController } from './controllers/datasets.controller';
import { DatasetsRepository } from './repositories/datasets.repository';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { DatasetFieldSanitizerService } from './services/dataset-field-sanitizer.service';
import { DatasetsService } from './services/datasets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dataset.name, schema: DatasetSchema }]),
    AuditModule,
  ],
  controllers: [DatasetsController],
  providers: [DatasetsRepository, DatasetsService, DatasetFieldSanitizerService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
