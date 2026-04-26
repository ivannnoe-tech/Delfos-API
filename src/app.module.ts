import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { createMongooseOptions } from './config/mongoose.config';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { FieldMappingsModule } from './modules/field-mappings/field-mappings.module';
import { HealthModule } from './modules/health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: createMongooseOptions,
    }),
    AuthModule,
    HealthModule,
    TenantsModule,
    UsersModule,
    ConnectionsModule,
    FieldMappingsModule,
    AuditModule,
  ],
})
export class AppModule {}
