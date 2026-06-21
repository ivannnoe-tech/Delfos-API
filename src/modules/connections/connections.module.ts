import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ConnectionsController } from './controllers/connections.controller';
import { ConnectionsRepository } from './repositories/connections.repository';
import { PostgresConnectionsRepository } from './repositories/postgres-connections.repository';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [AuditModule],
  controllers: [ConnectionsController],
  providers: [
    PostgresConnectionsRepository,
    { provide: ConnectionsRepository, useExisting: PostgresConnectionsRepository },
    ConnectionsService,
  ],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
