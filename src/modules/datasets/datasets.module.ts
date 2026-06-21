import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DatasetsController } from './controllers/datasets.controller';
import { DatasetsRepository } from './repositories/datasets.repository';
import { PostgresDatasetsRepository } from './repositories/postgres-datasets.repository';
import { DatasetFieldSanitizerService } from './services/dataset-field-sanitizer.service';
import { DatasetsService } from './services/datasets.service';

@Module({
  imports: [AuditModule],
  controllers: [DatasetsController],
  providers: [
    PostgresDatasetsRepository,
    { provide: DatasetsRepository, useExisting: PostgresDatasetsRepository },
    DatasetsService,
    DatasetFieldSanitizerService,
  ],
  exports: [DatasetsService],
})
export class DatasetsModule {}
