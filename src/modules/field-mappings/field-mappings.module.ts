import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { FieldMappingsController } from './controllers/field-mappings.controller';
import { FieldMappingsRepository } from './repositories/field-mappings.repository';
import { PostgresFieldMappingsRepository } from './repositories/postgres-field-mappings.repository';
import { FieldMappingsService } from './services/field-mappings.service';

@Module({
  imports: [AuditModule],
  controllers: [FieldMappingsController],
  providers: [
    PostgresFieldMappingsRepository,
    {
      provide: FieldMappingsRepository,
      useExisting: PostgresFieldMappingsRepository,
    },
    FieldMappingsService,
  ],
  exports: [FieldMappingsService],
})
export class FieldMappingsModule {}
