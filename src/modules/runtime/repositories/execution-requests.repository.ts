import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import {
  ExecutionRequest,
  ExecutionRequestDocument,
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';

export interface CreateExecutionRequestRecord {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  requestKey: string;
  kind: ExecutionRequestKind;
  status: ExecutionRequestStatus;
  queryDefinitionId?: Types.ObjectId;
  dashboardDefinitionId?: Types.ObjectId;
  reportDefinitionId?: Types.ObjectId;
  connectionId?: Types.ObjectId;
  datasetId?: Types.ObjectId;
  requestedByActorId?: string;
  requestedByRole?: AdminRole;
  mode: ExecutionRequestMode;
  reason: string;
  message: string;
  metadata: SanitizedMetadata;
}

export interface ExecutionRequestFilters {
  tenantId: Types.ObjectId;
  kind?: ExecutionRequestKind;
  status?: ExecutionRequestStatus;
  mode?: ExecutionRequestMode;
  queryDefinitionId?: Types.ObjectId;
  dashboardDefinitionId?: Types.ObjectId;
  reportDefinitionId?: Types.ObjectId;
  connectionId?: Types.ObjectId;
  datasetId?: Types.ObjectId;
}

@Injectable()
export class ExecutionRequestsRepository {
  constructor(
    @InjectModel(ExecutionRequest.name)
    private readonly executionRequestModel: Model<ExecutionRequestDocument>,
  ) {}

  create(record: CreateExecutionRequestRecord): Promise<ExecutionRequestDocument> {
    return this.executionRequestModel.create(record);
  }

  findByFilters(
    filters: ExecutionRequestFilters,
    page: number,
    pageSize: number,
  ): Promise<ExecutionRequestDocument[]> {
    return this.executionRequestModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: ExecutionRequestFilters): Promise<number> {
    return this.executionRequestModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
  ): Promise<ExecutionRequestDocument | null> {
    return this.executionRequestModel.findOne({ _id: id, tenantId }).exec();
  }

  private toMongoFilters(filters: ExecutionRequestFilters): FilterQuery<ExecutionRequestDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.mode ? { mode: filters.mode } : {}),
      ...(filters.queryDefinitionId ? { queryDefinitionId: filters.queryDefinitionId } : {}),
      ...(filters.dashboardDefinitionId
        ? { dashboardDefinitionId: filters.dashboardDefinitionId }
        : {}),
      ...(filters.reportDefinitionId ? { reportDefinitionId: filters.reportDefinitionId } : {}),
      ...(filters.connectionId ? { connectionId: filters.connectionId } : {}),
      ...(filters.datasetId ? { datasetId: filters.datasetId } : {}),
    };
  }
}
