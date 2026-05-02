import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { ExecutionRequestsController } from './controllers/execution-requests.controller';
import { ExecutionRequestsRepository } from './repositories/execution-requests.repository';
import { ExecutionRequest, ExecutionRequestSchema } from './schemas/execution-request.schema';
import { ExecutionRequestsService } from './services/execution-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ExecutionRequest.name, schema: ExecutionRequestSchema }]),
    AuditModule,
  ],
  controllers: [ExecutionRequestsController],
  providers: [ExecutionRequestsRepository, ExecutionRequestsService],
  exports: [ExecutionRequestsService],
})
export class RuntimeModule {}
