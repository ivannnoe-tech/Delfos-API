import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';
import {
  CreateUserRecord,
  UpdateUserRecord,
  UserRecord,
  UsersRepository,
} from './users.repository';

function toRecord(doc: UserDocument): UserRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoUsersRepository extends UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super();
  }

  async create(record: CreateUserRecord): Promise<UserRecord> {
    const created = await this.userModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
    });

    return toRecord(created);
  }

  async findByTenant(tenantId: string, page: number, pageSize: number): Promise<UserRecord[]> {
    const docs = await this.userModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countByTenant(tenantId: string): Promise<number> {
    return this.userModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) });
  }

  async updateByTenantAndId(
    tenantId: string,
    id: string,
    record: UpdateUserRecord,
  ): Promise<UserRecord | null> {
    const doc = await this.userModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      record,
      { new: true, runValidators: true },
    );

    return doc ? toRecord(doc) : null;
  }
}
