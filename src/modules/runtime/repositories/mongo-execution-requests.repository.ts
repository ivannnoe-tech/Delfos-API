import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { ExecutionRequest, ExecutionRequestDocument } from '../schemas/execution-request.schema';
import {
  CreateExecutionRequestRecord,
  ExecutionRequestFilters,
  ExecutionRequestRecord,
  ExecutionRequestsRepository,
} from './execution-requests.repository';
import { ExecutionRequestStatus } from '../schemas/execution-request.schema';

function toRecord(doc: ExecutionRequestDocument): ExecutionRequestRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    requestKey: doc.requestKey,
    kind: doc.kind,
    status: doc.status,
    queryDefinitionId: doc.queryDefinitionId?.toString(),
    dashboardDefinitionId: doc.dashboardDefinitionId?.toString(),
    reportDefinitionId: doc.reportDefinitionId?.toString(),
    connectionId: doc.connectionId?.toString(),
    datasetId: doc.datasetId?.toString(),
    requestedByActorId: doc.requestedByActorId,
    requestedByRole: doc.requestedByRole,
    mode: doc.mode,
    reason: doc.reason,
    message: doc.message,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toOptionalObjectId(value?: string): Types.ObjectId | undefined {
  return value ? new Types.ObjectId(value) : undefined;
}

@Injectable()
export class MongoExecutionRequestsRepository extends ExecutionRequestsRepository {
  constructor(
    @InjectModel(ExecutionRequest.name)
    private readonly executionRequestModel: Model<ExecutionRequestDocument>,
  ) {
    super();
  }

  async create(record: CreateExecutionRequestRecord): Promise<ExecutionRequestRecord> {
    const created = await this.executionRequestModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      requestKey: record.requestKey,
      kind: record.kind,
      status: record.status,
      queryDefinitionId: toOptionalObjectId(record.queryDefinitionId),
      dashboardDefinitionId: toOptionalObjectId(record.dashboardDefinitionId),
      reportDefinitionId: toOptionalObjectId(record.reportDefinitionId),
      connectionId: toOptionalObjectId(record.connectionId),
      datasetId: toOptionalObjectId(record.datasetId),
      requestedByActorId: record.requestedByActorId,
      requestedByRole: record.requestedByRole,
      mode: record.mode,
      reason: record.reason,
      message: record.message,
      metadata: record.metadata,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: ExecutionRequestFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestRecord[]> {
    const docs = await this.executionRequestModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: ExecutionRequestFilters): Promise<number> {
    return this.executionRequestModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ExecutionRequestRecord | null> {
    const doc = await this.executionRequestModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateStatusByTenantAndId(
    tenantId: string,
    id: string,
    status: ExecutionRequestStatus,
  ): Promise<ExecutionRequestRecord | null> {
    const doc = await this.executionRequestModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { status },
      { new: true },
    );

    return doc ? toRecord(doc) : null;
  }

  private toMongoFilters(filters: ExecutionRequestFilters): FilterQuery<ExecutionRequestDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.mode ? { mode: filters.mode } : {}),
      ...(filters.queryDefinitionId
        ? { queryDefinitionId: new Types.ObjectId(filters.queryDefinitionId) }
        : {}),
      ...(filters.dashboardDefinitionId
        ? { dashboardDefinitionId: new Types.ObjectId(filters.dashboardDefinitionId) }
        : {}),
      ...(filters.reportDefinitionId
        ? { reportDefinitionId: new Types.ObjectId(filters.reportDefinitionId) }
        : {}),
      ...(filters.connectionId ? { connectionId: new Types.ObjectId(filters.connectionId) } : {}),
      ...(filters.datasetId ? { datasetId: new Types.ObjectId(filters.datasetId) } : {}),
    };
  }
}
