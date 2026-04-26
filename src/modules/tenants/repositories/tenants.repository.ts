import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Tenant, TenantDocument } from '../schemas/tenant.schema';

export interface CreateTenantRecord {
  name: string;
  slug: string;
  status?: Tenant['status'];
  settings: Tenant['settings'];
}

export type UpdateTenantRecord = Partial<CreateTenantRecord>;

@Injectable()
export class TenantsRepository {
  constructor(@InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>) {}

  create(record: CreateTenantRecord): Promise<TenantDocument> {
    return this.tenantModel.create(record);
  }

  findAll(page: number, pageSize: number): Promise<TenantDocument[]> {
    return this.tenantModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
  }

  countAll(): Promise<number> {
    return this.tenantModel.countDocuments().exec();
  }

  findById(id: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(id).exec();
  }

  updateById(id: string, record: UpdateTenantRecord): Promise<TenantDocument | null> {
    return this.tenantModel.findByIdAndUpdate(id, record, { new: true, runValidators: true }).exec();
  }
}
