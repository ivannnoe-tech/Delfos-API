import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
}

@Schema({ collection: 'tenants', timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 80 })
  slug!: string;

  @Prop({ enum: TenantStatus, default: TenantStatus.Active })
  status!: TenantStatus;

  @Prop({ type: Object, default: {} })
  settings!: SanitizedMetadata;

  createdAt!: Date;
  updatedAt!: Date;
}

export type TenantDocument = HydratedDocument<Tenant> & { _id: Types.ObjectId };

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ status: 1 });
