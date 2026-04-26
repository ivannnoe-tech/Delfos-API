import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';

export interface CreateUserRecord {
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  role?: User['role'];
  status?: User['status'];
}

export type UpdateUserRecord = Partial<Omit<CreateUserRecord, 'tenantId'>>;

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  create(record: CreateUserRecord): Promise<UserDocument> {
    return this.userModel.create(record);
  }

  findByTenant(tenantId: Types.ObjectId, page: number, pageSize: number): Promise<UserDocument[]> {
    return this.userModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countByTenant(tenantId: Types.ObjectId): Promise<number> {
    return this.userModel.countDocuments({ tenantId }).exec();
  }

  updateByTenantAndId(
    tenantId: Types.ObjectId,
    id: string,
    record: UpdateUserRecord,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ _id: id, tenantId }, record, { new: true, runValidators: true })
      .exec();
  }
}
