import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { TenantsController } from './controllers/tenants.controller';
import { MongoTenantsRepository } from './repositories/mongo-tenants.repository';
import { PostgresTenantsRepository } from './repositories/postgres-tenants.repository';
import { TenantsRepository } from './repositories/tenants.repository';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantsService } from './services/tenants.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }])],
  controllers: [TenantsController],
  providers: [
    MongoTenantsRepository,
    PostgresTenantsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: TenantsRepository,
      inject: [AppConfigService, MongoTenantsRepository, PostgresTenantsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoTenantsRepository,
        postgres: PostgresTenantsRepository,
      ): TenantsRepository => (config.postgresUrl ? postgres : mongo),
    },
    TenantsService,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
