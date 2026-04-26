import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum UserRole {
  Owner = 'owner',
  Admin = 'admin',
  Operator = 'operator',
  Viewer = 'viewer',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
}

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 160 })
  email!: string;

  @Prop({ enum: UserRole, default: UserRole.Viewer })
  role!: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.Invited })
  status!: UserStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User> & { _id: Types.ObjectId };

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, status: 1 });
