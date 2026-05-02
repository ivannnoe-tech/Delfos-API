import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { createMongooseOptions } from './config/mongoose.config';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { DashboardDefinitionsModule } from './modules/dashboard-definitions/dashboard-definitions.module';
import { DatasetsModule } from './modules/datasets/datasets.module';
import { ExecutionPreviewModule } from './modules/execution-preview/execution-preview.module';
import { FieldMappingsModule } from './modules/field-mappings/field-mappings.module';
import { HealthModule } from './modules/health/health.module';
import { QueryDefinitionsModule } from './modules/query-definitions/query-definitions.module';
import { ReportDefinitionsModule } from './modules/report-definitions/report-definitions.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
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
    CredentialsModule,
    DashboardDefinitionsModule,
    DatasetsModule,
    ExecutionPreviewModule,
    QueryDefinitionsModule,
    ReportDefinitionsModule,
    RuntimeModule,
    FieldMappingsModule,
    AuditModule,
  ],
})
export class AppModule {}
