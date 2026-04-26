import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Credential, CredentialDocument, CredentialStatus } from '../schemas/credential.schema';

export interface CreateCredentialRecord {
  tenantId: Types.ObjectId;
  connectionId?: Types.ObjectId;
  type: Credential['type'];
  provider?: string;
  name: string;
  status?: Credential['status'];
  maskedPreview: string | null;
  protectedSecretValue: string;
  protectionProvider: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CredentialFilters {
  tenantId: Types.ObjectId;
  connectionId?: Types.ObjectId;
}

export interface RotateCredentialRecord {
  maskedPreview: string | null;
  protectedSecretValue: string;
  protectionProvider: string;
  rotatedAt: Date;
  status: CredentialStatus.Active;
  updatedBy?: string;
}

export interface RevokeCredentialRecord {
  status: CredentialStatus.Revoked;
  revokedAt: Date;
  updatedBy?: string;
}

@Injectable()
export class CredentialsRepository {
  constructor(
    @InjectModel(Credential.name)
    private readonly credentialModel: Model<CredentialDocument>,
  ) {}

  create(record: CreateCredentialRecord): Promise<CredentialDocument> {
    return this.credentialModel.create(record);
  }

  findByFilters(
    filters: CredentialFilters,
    page: number,
    pageSize: number,
  ): Promise<CredentialDocument[]> {
    return this.credentialModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByFilters(filters: CredentialFilters): Promise<number> {
    return this.credentialModel.countDocuments(this.toMongoFilters(filters)).exec();
  }

  findByTenantAndId(tenantId: Types.ObjectId, id: string): Promise<CredentialDocument | null> {
    return this.credentialModel.findOne({ _id: id, tenantId }).exec();
  }

  rotateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: RotateCredentialRecord,
  ): Promise<CredentialDocument | null> {
    return this.credentialModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  revokeByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: RevokeCredentialRecord,
  ): Promise<CredentialDocument | null> {
    return this.credentialModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }

  private toMongoFilters(filters: CredentialFilters): FilterQuery<CredentialDocument> {
    return {
      tenantId: filters.tenantId,
      ...(filters.connectionId ? { connectionId: filters.connectionId } : {}),
    };
  }
}
