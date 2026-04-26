import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Connection, ConnectionDocument } from '../schemas/connection.schema';

export interface CreateConnectionRecord {
  tenantId: Types.ObjectId;
  name: string;
  type?: Connection['type'];
  baseUrl: string;
  authType?: Connection['authType'];
  credentialRef?: string;
  allowedHeaders: string[];
  metadata: Connection['metadata'];
  status?: Connection['status'];
}

export type UpdateConnectionRecord = Partial<CreateConnectionRecord>;

@Injectable()
export class ConnectionsRepository {
  constructor(
    @InjectModel(Connection.name) private readonly connectionModel: Model<ConnectionDocument>,
  ) {}

  create(record: CreateConnectionRecord): Promise<ConnectionDocument> {
    return this.connectionModel.create(record);
  }

  findByTenant(
    tenantId: Types.ObjectId,
    page: number,
    pageSize: number,
  ): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByTenant(tenantId: Types.ObjectId): Promise<number> {
    return this.connectionModel.countDocuments({ tenantId }).exec();
  }

  findByTenantAndId(tenantId: Types.ObjectId, id: string): Promise<ConnectionDocument | null> {
    return this.connectionModel.findOne({ _id: id, tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateConnectionRecord,
  ): Promise<ConnectionDocument | null> {
    return this.connectionModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }
}
