import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FieldMappingsController } from './controllers/field-mappings.controller';
import { FieldMappingsRepository } from './repositories/field-mappings.repository';
import { FieldMapping, FieldMappingSchema } from './schemas/field-mapping.schema';
import { FieldMappingsService } from './services/field-mappings.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: FieldMapping.name, schema: FieldMappingSchema }])],
  controllers: [FieldMappingsController],
  providers: [FieldMappingsRepository, FieldMappingsService],
  exports: [FieldMappingsService],
})
export class FieldMappingsModule {}
