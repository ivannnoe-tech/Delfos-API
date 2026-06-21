import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { DatasetsController } from './controllers/datasets.controller';
import { DatasetsRepository } from './repositories/datasets.repository';
import { MongoDatasetsRepository } from './repositories/mongo-datasets.repository';
import { PostgresDatasetsRepository } from './repositories/postgres-datasets.repository';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { DatasetFieldSanitizerService } from './services/dataset-field-sanitizer.service';
import { DatasetsService } from './services/datasets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dataset.name, schema: DatasetSchema }]),
    AuditModule,
  ],
  controllers: [DatasetsController],
  providers: [
    MongoDatasetsRepository,
    PostgresDatasetsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: DatasetsRepository,
      inject: [AppConfigService, MongoDatasetsRepository, PostgresDatasetsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoDatasetsRepository,
        postgres: PostgresDatasetsRepository,
      ): DatasetsRepository => (config.postgresUrl ? postgres : mongo),
    },
    DatasetsService,
    DatasetFieldSanitizerService,
  ],
  exports: [DatasetsService],
})
export class DatasetsModule {}
