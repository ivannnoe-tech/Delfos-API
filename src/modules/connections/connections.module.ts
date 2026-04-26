import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConnectionsController } from './controllers/connections.controller';
import { ConnectionsRepository } from './repositories/connections.repository';
import { Connection, ConnectionSchema } from './schemas/connection.schema';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Connection.name, schema: ConnectionSchema }])],
  controllers: [ConnectionsController],
  providers: [ConnectionsRepository, ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
