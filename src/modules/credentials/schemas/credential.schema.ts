import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum CredentialStatus {
  Active = 'active',
  Inactive = 'inactive',
  Revoked = 'revoked',
}

export enum CredentialType {
  ApiKey = 'api_key',
  BearerToken = 'bearer_token',
  BasicAuth = 'basic_auth',
  OAuthClient = 'oauth_client',
  DatabaseConnectionString = 'database_connection_string',
  Custom = 'custom',
}

@Schema({ collection: 'credentials', timestamps: true })
export class Credential {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Connection' })
  connectionId?: Types.ObjectId;

  @Prop({ required: true, enum: CredentialType })
  type!: CredentialType;

  @Prop({ trim: true, maxlength: 80 })
  provider?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, enum: CredentialStatus, default: CredentialStatus.Active })
  status!: CredentialStatus;

  @Prop({ type: String, default: null })
  maskedPreview!: string | null;

  @Prop({ required: true, select: false })
  protectedSecretValue!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  protectionProvider!: string;

  @Prop()
  rotatedAt?: Date;

  @Prop()
  revokedAt?: Date;

  @Prop({ trim: true, maxlength: 128 })
  createdBy?: string;

  @Prop({ trim: true, maxlength: 128 })
  updatedBy?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CredentialDocument = HydratedDocument<Credential> & { _id: Types.ObjectId };

export const CredentialSchema = SchemaFactory.createForClass(Credential);

CredentialSchema.index({ tenantId: 1, connectionId: 1 });
CredentialSchema.index({ tenantId: 1, status: 1 });
CredentialSchema.index({ tenantId: 1, type: 1 });
