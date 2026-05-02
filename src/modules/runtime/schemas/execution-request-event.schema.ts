import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestStatus } from './execution-request.schema';

export enum ExecutionRequestEventType {
  Requested = 'requested',
  Accepted = 'accepted',
  StatusChanged = 'status_changed',
  Blocked = 'blocked',
  Failed = 'failed',
  CompletedDemo = 'completed_demo',
  NotSupported = 'not_supported',
  NoteAdded = 'note_added',
}

@Schema({
  collection: 'execution_request_events',
  timestamps: { createdAt: true, updatedAt: false },
})
export class ExecutionRequestEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'ExecutionRequest' })
  executionRequestId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  requestKey!: string;

  @Prop({ required: true, enum: ExecutionRequestEventType })
  eventType!: ExecutionRequestEventType;

  @Prop({ enum: ExecutionRequestStatus })
  previousStatus?: ExecutionRequestStatus;

  @Prop({ enum: ExecutionRequestStatus })
  nextStatus?: ExecutionRequestStatus;

  @Prop({ trim: true, maxlength: 500 })
  message?: string;

  @Prop({ trim: true, maxlength: 240 })
  reason?: string;

  @Prop({ trim: true, maxlength: 128 })
  actorId?: string;

  @Prop({ enum: AdminRole })
  actorRole?: AdminRole;

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;

  createdAt!: Date;
}

export type ExecutionRequestEventDocument = HydratedDocument<ExecutionRequestEvent> & {
  _id: Types.ObjectId;
};

export const ExecutionRequestEventSchema = SchemaFactory.createForClass(ExecutionRequestEvent);

ExecutionRequestEventSchema.index({ tenantId: 1, executionRequestId: 1, createdAt: -1 });
ExecutionRequestEventSchema.index({ tenantId: 1, requestKey: 1, createdAt: -1 });
ExecutionRequestEventSchema.index({ tenantId: 1, eventType: 1 });
