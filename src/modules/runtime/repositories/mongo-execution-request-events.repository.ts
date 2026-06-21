import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  ExecutionRequestEvent,
  ExecutionRequestEventDocument,
} from '../schemas/execution-request-event.schema';
import {
  CreateExecutionRequestEventRecord,
  ExecutionRequestEventFilters,
  ExecutionRequestEventRecord,
  ExecutionRequestEventsRepository,
} from './execution-request-events.repository';

function toRecord(doc: ExecutionRequestEventDocument): ExecutionRequestEventRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    executionRequestId: doc.executionRequestId.toString(),
    requestKey: doc.requestKey,
    eventType: doc.eventType,
    previousStatus: doc.previousStatus,
    nextStatus: doc.nextStatus,
    message: doc.message,
    reason: doc.reason,
    actorId: doc.actorId,
    actorRole: doc.actorRole,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

@Injectable()
export class MongoExecutionRequestEventsRepository extends ExecutionRequestEventsRepository {
  constructor(
    @InjectModel(ExecutionRequestEvent.name)
    private readonly executionRequestEventModel: Model<ExecutionRequestEventDocument>,
  ) {
    super();
  }

  async create(record: CreateExecutionRequestEventRecord): Promise<ExecutionRequestEventRecord> {
    const created = await this.executionRequestEventModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      executionRequestId: new Types.ObjectId(record.executionRequestId),
      requestKey: record.requestKey,
      eventType: record.eventType,
      previousStatus: record.previousStatus,
      nextStatus: record.nextStatus,
      message: record.message,
      reason: record.reason,
      actorId: record.actorId,
      actorRole: record.actorRole,
      metadata: record.metadata,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: ExecutionRequestEventFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestEventRecord[]> {
    const docs = await this.executionRequestEventModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: ExecutionRequestEventFilters): Promise<number> {
    return this.executionRequestEventModel.countDocuments(this.toMongoFilters(filters));
  }

  private toMongoFilters(
    filters: ExecutionRequestEventFilters,
  ): FilterQuery<ExecutionRequestEventDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      executionRequestId: new Types.ObjectId(filters.executionRequestId),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
    };
  }
}
