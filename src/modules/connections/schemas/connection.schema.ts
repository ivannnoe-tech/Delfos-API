import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SanitizedMetadata } from '../../../core/utils/sanitize-metadata';

export enum ConnectionAuthType {
  None = 'none',
  ApiKeyHeader = 'api_key_header',
  BearerToken = 'bearer_token',
  Basic = 'basic',
  OAuth2ClientCredentials = 'oauth2_client_credentials',
}

export enum ConnectionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
}

export enum ConnectionType {
  CustomerApi = 'customer_api',
}

@Schema({ collection: 'connections', timestamps: true })
export class Connection {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ enum: ConnectionType, default: ConnectionType.CustomerApi })
  type!: ConnectionType;

  @Prop({ required: true, trim: true, maxlength: 2048 })
  baseUrl!: string;

  @Prop({ enum: ConnectionAuthType, default: ConnectionAuthType.None })
  authType!: ConnectionAuthType;

  @Prop({ trim: true, maxlength: 160 })
  credentialRef?: string;

  @Prop({ type: [String], default: [] })
  allowedHeaders!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: SanitizedMetadata;

  @Prop({ enum: ConnectionStatus, default: ConnectionStatus.Draft })
  status!: ConnectionStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ConnectionDocument = HydratedDocument<Connection> & { _id: Types.ObjectId };

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

ConnectionSchema.index({ tenantId: 1, name: 1 }, { unique: true });
ConnectionSchema.index({ tenantId: 1, status: 1 });
ConnectionSchema.index({ tenantId: 1, type: 1 });
