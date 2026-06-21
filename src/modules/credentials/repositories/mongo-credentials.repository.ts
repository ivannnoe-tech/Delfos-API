import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Credential, CredentialDocument } from '../schemas/credential.schema';
import {
  CreateCredentialRecord,
  CredentialFilters,
  CredentialRecord,
  CredentialsRepository,
  RevokeCredentialRecord,
  RotateCredentialRecord,
} from './credentials.repository';

function toRecord(doc: CredentialDocument): CredentialRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    connectionId: doc.connectionId?.toString(),
    type: doc.type,
    provider: doc.provider,
    name: doc.name,
    status: doc.status,
    maskedPreview: doc.maskedPreview,
    rotatedAt: doc.rotatedAt,
    revokedAt: doc.revokedAt,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoCredentialsRepository extends CredentialsRepository {
  constructor(
    @InjectModel(Credential.name)
    private readonly credentialModel: Model<CredentialDocument>,
  ) {
    super();
  }

  async create(record: CreateCredentialRecord): Promise<CredentialRecord> {
    const created = await this.credentialModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      connectionId: record.connectionId ? new Types.ObjectId(record.connectionId) : undefined,
      type: record.type,
      provider: record.provider,
      name: record.name,
      status: record.status,
      maskedPreview: record.maskedPreview,
      protectedSecretValue: record.protectedSecretValue,
      protectionProvider: record.protectionProvider,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    });

    return toRecord(created);
  }

  async findByFilters(
    filters: CredentialFilters,
    page: number,
    pageSize: number,
  ): Promise<CredentialRecord[]> {
    const docs = await this.credentialModel
      .find(this.toMongoFilters(filters))
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByFilters(filters: CredentialFilters): Promise<number> {
    return this.credentialModel.countDocuments(this.toMongoFilters(filters));
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<CredentialRecord | null> {
    const doc = await this.credentialModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async rotateByTenantAndId(
    tenantId: string,
    id: string,
    record: RotateCredentialRecord,
  ): Promise<CredentialRecord | null> {
    const doc = await this.credentialModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      record,
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }

  async revokeByTenantAndId(
    tenantId: string,
    id: string,
    record: RevokeCredentialRecord,
  ): Promise<CredentialRecord | null> {
    const doc = await this.credentialModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      record,
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }

  private toMongoFilters(filters: CredentialFilters): FilterQuery<CredentialDocument> {
    return {
      tenantId: new Types.ObjectId(filters.tenantId),
      ...(filters.connectionId ? { connectionId: new Types.ObjectId(filters.connectionId) } : {}),
    };
  }
}
