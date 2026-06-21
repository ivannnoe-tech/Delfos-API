import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../audit/audit.module';
import { ConnectionsController } from './controllers/connections.controller';
import { ConnectionsRepository } from './repositories/connections.repository';
import { MongoConnectionsRepository } from './repositories/mongo-connections.repository';
import { PostgresConnectionsRepository } from './repositories/postgres-connections.repository';
import { Connection, ConnectionSchema } from './schemas/connection.schema';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([{ name: Connection.name, schema: ConnectionSchema }]),
  ],
  controllers: [ConnectionsController],
  providers: [
    MongoConnectionsRepository,
    PostgresConnectionsRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: ConnectionsRepository,
      inject: [AppConfigService, MongoConnectionsRepository, PostgresConnectionsRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoConnectionsRepository,
        postgres: PostgresConnectionsRepository,
      ): ConnectionsRepository => (config.postgresUrl ? postgres : mongo),
    },
    ConnectionsService,
  ],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
