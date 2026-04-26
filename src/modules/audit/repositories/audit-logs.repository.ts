import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

export interface CreateAuditLogRecord {
  tenantId: Types.ObjectId;
  actorUserId?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  metadata: AuditLog['metadata'];
}

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  create(record: CreateAuditLogRecord): Promise<AuditLogDocument> {
    return this.auditLogModel.create(record);
  }
}
