import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { ExecutionRequestsController } from './controllers/execution-requests.controller';
import { ExecutionRequestEventsRepository } from './repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from './repositories/execution-requests.repository';
import { ExecutionRequest, ExecutionRequestSchema } from './schemas/execution-request.schema';
import {
  ExecutionRequestEvent,
  ExecutionRequestEventSchema,
} from './schemas/execution-request-event.schema';
import { ExecutionRequestsService } from './services/execution-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExecutionRequest.name, schema: ExecutionRequestSchema },
      { name: ExecutionRequestEvent.name, schema: ExecutionRequestEventSchema },
    ]),
    AuditModule,
  ],
  controllers: [ExecutionRequestsController],
  providers: [
    ExecutionRequestEventsRepository,
    ExecutionRequestsRepository,
    ExecutionRequestsService,
  ],
  exports: [ExecutionRequestsService],
})
export class RuntimeModule {}
