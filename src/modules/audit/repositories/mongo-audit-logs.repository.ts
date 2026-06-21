import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { AuditLogRecord, AuditLogsRepository, CreateAuditLogRecord } from './audit-logs.repository';

function toRecord(doc: AuditLogDocument): AuditLogRecord {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    actorUserId: doc.actorUserId?.toString(),
    action: doc.action,
    entity: doc.entity,
    entityId: doc.entityId,
    metadata: doc.metadata,
    timestamp: doc.timestamp,
  };
}

@Injectable()
export class MongoAuditLogsRepository extends AuditLogsRepository {
  constructor(@InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>) {
    super();
  }

  async create(record: CreateAuditLogRecord): Promise<AuditLogRecord> {
    const created = await this.auditLogModel.create({
      tenantId: new Types.ObjectId(record.tenantId),
      actorUserId: record.actorUserId ? new Types.ObjectId(record.actorUserId) : undefined,
      action: record.action,
      entity: record.entity,
      entityId: record.entityId,
      metadata: record.metadata,
    });

    return toRecord(created);
  }
}
