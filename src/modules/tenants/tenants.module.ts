import { Module } from '@nestjs/common';

import { TenantsController } from './controllers/tenants.controller';
import { PostgresTenantsRepository } from './repositories/postgres-tenants.repository';
import { TenantsRepository } from './repositories/tenants.repository';
import { TenantsService } from './services/tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [
    PostgresTenantsRepository,
    { provide: TenantsRepository, useExisting: PostgresTenantsRepository },
    TenantsService,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
