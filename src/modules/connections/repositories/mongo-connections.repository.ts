import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Connection, ConnectionDocument } from '../schemas/connection.schema';
import {
  ConnectionRecord,
  ConnectionsRepository,
  CreateConnectionRecord,
  UpdateConnectionRecord,
} from './connections.repository';

function toRecord(doc: ConnectionDocument): ConnectionRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    type: doc.type,
    baseUrl: doc.baseUrl,
    authType: doc.authType,
    credentialRef: doc.credentialRef,
    allowedHeaders: doc.allowedHeaders,
    metadata: doc.metadata,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoConnectionsRepository extends ConnectionsRepository {
  constructor(
    @InjectModel(Connection.name) private readonly connectionModel: Model<ConnectionDocument>,
  ) {
    super();
  }

  async create(record: CreateConnectionRecord): Promise<ConnectionRecord> {
    const created = await this.connectionModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      name: record.name,
      type: record.type,
      baseUrl: record.baseUrl,
      authType: record.authType,
      credentialRef: record.credentialRef,
      allowedHeaders: record.allowedHeaders,
      metadata: record.metadata,
      status: record.status,
    });

    return toRecord(created);
  }

  async findByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ConnectionRecord[]> {
    const docs = await this.connectionModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByTenant(tenantId: string): Promise<number> {
    return this.connectionModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) });
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<ConnectionRecord | null> {
    const doc = await this.connectionModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return doc ? toRecord(doc) : null;
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateConnectionRecord,
  ): Promise<ConnectionRecord | null> {
    const doc = await this.connectionModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      record,
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }
}
