import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { FieldMappingsController } from './controllers/field-mappings.controller';
import { FieldMappingsRepository } from './repositories/field-mappings.repository';
import { MongoFieldMappingsRepository } from './repositories/mongo-field-mappings.repository';
import { PostgresFieldMappingsRepository } from './repositories/postgres-field-mappings.repository';
import { FieldMapping, FieldMappingSchema } from './schemas/field-mapping.schema';
import { FieldMappingsService } from './services/field-mappings.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([{ name: FieldMapping.name, schema: FieldMappingSchema }]),
  ],
  controllers: [FieldMappingsController],
  providers: [
    MongoFieldMappingsRepository,
    PostgresFieldMappingsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: FieldMappingsRepository,
      inject: [AppConfigService, MongoFieldMappingsRepository, PostgresFieldMappingsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoFieldMappingsRepository,
        postgres: PostgresFieldMappingsRepository,
      ): FieldMappingsRepository => (config.postgresUrl ? postgres : mongo),
    },
    FieldMappingsService,
  ],
  exports: [FieldMappingsService],
})
export class FieldMappingsModule {}
