import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';

export enum ExecutionRequestKind {
  Query = 'query',
  Dashboard = 'dashboard',
  Report = 'report',
}

export enum ExecutionRequestMode {
  Demo = 'demo',
  DryRun = 'dry_run',
  FutureRuntime = 'future_runtime',
}

export enum ExecutionRequestStatus {
  Queued = 'queued',
  Accepted = 'accepted',
  Blocked = 'blocked',
  Failed = 'failed',
  CompletedDemo = 'completed_demo',
  NotSupported = 'not_supported',
}

@Schema({ collection: 'execution_requests', timestamps: true })
export class ExecutionRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  requestKey!: string;

  @Prop({ required: true, enum: ExecutionRequestKind })
  kind!: ExecutionRequestKind;

  @Prop({ required: true, enum: ExecutionRequestStatus, default: ExecutionRequestStatus.Accepted })
  status!: ExecutionRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'QueryDefinition' })
  queryDefinitionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DashboardDefinition' })
  dashboardDefinitionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ReportDefinition' })
  reportDefinitionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Connection' })
  connectionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dataset' })
  datasetId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 128 })
  requestedByActorId?: string;

  @Prop({ enum: AdminRole })
  requestedByRole?: AdminRole;

  @Prop({
    required: true,
    enum: ExecutionRequestMode,
    default: ExecutionRequestMode.FutureRuntime,
  })
  mode!: ExecutionRequestMode;

  @Prop({ trim: true, maxlength: 240 })
  reason?: string;

  @Prop({ trim: true, maxlength: 500 })
  message?: string;

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ExecutionRequestDocument = HydratedDocument<ExecutionRequest> & {
  _id: Types.ObjectId;
};

export const ExecutionRequestSchema = SchemaFactory.createForClass(ExecutionRequest);

ExecutionRequestSchema.index({ tenantId: 1, requestKey: 1 }, { unique: true });
ExecutionRequestSchema.index({ tenantId: 1, createdAt: -1 });
ExecutionRequestSchema.index({ tenantId: 1, status: 1 });
ExecutionRequestSchema.index({ tenantId: 1, kind: 1 });
ExecutionRequestSchema.index({ tenantId: 1, queryDefinitionId: 1 });
ExecutionRequestSchema.index({ tenantId: 1, dashboardDefinitionId: 1 });
ExecutionRequestSchema.index({ tenantId: 1, reportDefinitionId: 1 });
