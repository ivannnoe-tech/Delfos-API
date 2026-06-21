import { Injectable } from '@nestjs/common';

import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogRecord, AuditLogsRepository } from '../repositories/audit-logs.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async record(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogsRepository.create({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      action: dto.action,
      entity: dto.entity,
      entityId: dto.entityId,
      metadata: sanitizeMetadata(dto.metadata),
    });

    return this.toResponse(auditLog);
  }

  private toResponse(auditLog: AuditLogRecord): AuditLogResponseDto {
    return {
      id: auditLog.id,
      tenantId: auditLog.tenantId,
      actorUserId: auditLog.actorUserId,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      timestamp: auditLog.timestamp.toISOString(),
    };
  }
}
