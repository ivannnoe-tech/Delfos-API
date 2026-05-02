import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import {
  ExecutionRequestEvent,
  ExecutionRequestEventDocument,
  ExecutionRequestEventType,
} from '../schemas/execution-request-event.schema';

export interface CreateExecutionRequestEventRecord {
  tenantId: Types.ObjectId;
  executionRequestId: Types.ObjectId;
  requestKey: string;
  eventType: ExecutionRequestEventType;
  previousStatus?: ExecutionRequestStatus;
  nextStatus?: ExecutionRequestStatus;
  message?: string;
  reason?: string;
  actorId?: string;
  actorRole?: AdminRole;
  metadata: SanitizedMetadata;
}

export interface ExecutionRequestEventFilters {
  tenantId: Types.ObjectId;
  executionRequestId: Types.ObjectId;
  eventType?: ExecutionRequestEventType;
}

@Injectable()
export class ExecutionRequestEventsRepository {
  constructor(
    @InjectModel(ExecutionRequestEvent.name)
    private readonly executionRequestEventModel: Model<ExecutionRequestEventDocument>,
  ) {}

  create(record: CreateExecutionRequestEventRecord): Promise<ExecutionRequestEventDocument> {
    return this.executionRequestEventModel.create(record);
  }

  findByFilters(
    filters: ExecutionRequestEventFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestEventDocument[]> {
    return this.executionRequestEventModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: ExecutionRequestEventFilters): Promise<number> {
    return this.executionRequestEventModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  private toMongoFilters(
    filters: ExecutionRequestEventFilters,
  ): FilterQuery<ExecutionRequestEventDocument> {
    return {
      tenantId: filters.tenantId,
      executionRequestId: filters.executionRequestId,
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
    };
  }
}
