import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorUserId?: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  action!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  entity!: string;

  @Prop({ trim: true, maxlength: 80 })
  entityId?: string;

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;

  @Prop({ default: Date.now })
  timestamp!: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog> & { _id: Types.ObjectId };

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, entity: 1, entityId: 1 });
