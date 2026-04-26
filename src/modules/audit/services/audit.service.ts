import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async record(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogsRepository.create({
      tenantId: new Types.ObjectId(dto.tenantId),
      actorUserId: dto.actorUserId ? new Types.ObjectId(dto.actorUserId) : undefined,
      action: dto.action,
      entity: dto.entity,
      entityId: dto.entityId,
      metadata: sanitizeMetadata(dto.metadata),
    });

    return this.toResponse(auditLog);
  }

  private toResponse(auditLog: AuditLogDocument): AuditLogResponseDto {
    return {
      id: auditLog._id.toString(),
      tenantId: auditLog.tenantId.toString(),
      actorUserId: auditLog.actorUserId?.toString(),
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      timestamp: auditLog.timestamp.toISOString(),
    };
  }
}
