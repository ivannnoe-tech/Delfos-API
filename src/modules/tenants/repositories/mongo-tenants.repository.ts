import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import {
  CreateTenantRecord,
  TenantRecord,
  TenantsRepository,
  UpdateTenantRecord,
} from './tenants.repository';

function toRecord(doc: TenantDocument): TenantRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    status: doc.status,
    settings: doc.settings,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoTenantsRepository extends TenantsRepository {
  constructor(@InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>) {
    super();
  }

  async create(record: CreateTenantRecord): Promise<TenantRecord> {
    const created = await this.tenantModel.create(record);
    return toRecord(created);
  }

  async findAll(page: number, pageSize: number): Promise<TenantRecord[]> {
    const docs = await this.tenantModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return docs.map(toRecord);
  }

  countAll(): Promise<number> {
    return this.tenantModel.countDocuments();
  }

  async findById(id: string): Promise<TenantRecord | null> {
    const doc = await this.tenantModel.findById(id);
    return doc ? toRecord(doc) : null;
  }

  async updateById(id: string, record: UpdateTenantRecord): Promise<TenantRecord | null> {
    const doc = await this.tenantModel.findByIdAndUpdate(id, record, {
      new: true,
      runValidators: true,
    });

    return doc ? toRecord(doc) : null;
  }
}
