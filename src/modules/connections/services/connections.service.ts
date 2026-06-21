import { Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { ConnectionResponseDto } from '../dto/connection-response.dto';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { ConnectionRecord, ConnectionsRepository } from '../repositories/connections.repository';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connectionsRepository: ConnectionsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateConnectionDto,
    actor: { actorId?: string } = {},
  ): Promise<ConnectionResponseDto> {
    const connection = await this.connectionsRepository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      type: dto.type,
      baseUrl: dto.baseUrl,
      authType: dto.authType,
      credentialRef: dto.credentialRef,
      allowedHeaders: dto.allowedHeaders ?? [],
      metadata: sanitizeMetadata(dto.metadata),
      status: dto.status,
    });

    await this.recordAudit('connection.created', connection, actor);

    return this.toResponse(connection);
  }

  async findByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ListResponse<ConnectionResponseDto>> {
    const [items, total] = await Promise.all([
      this.connectionsRepository.findByTenant(tenantId, page, pageSize),
      this.connectionsRepository.countByTenant(tenantId),
    ]);

    return {
      items: items.map((connection) => this.toResponse(connection)),
      meta: buildListMeta(page, pageSize, total),
    };
  }

  async findOne(tenantId: string, id: string): Promise<ConnectionResponseDto> {
    const connection = await this.connectionsRepository.findByTenantAndId(tenantId, id);

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    return this.toResponse(connection);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateConnectionDto,
    actor: { actorId?: string } = {},
  ): Promise<ConnectionResponseDto> {
    const connection = await this.connectionsRepository.updateByTenantAndId(tenantId, id, {
      ...dto,
      metadata: dto.metadata ? sanitizeMetadata(dto.metadata) : undefined,
    });

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    await this.recordAudit('connection.updated', connection, actor);

    return this.toResponse(connection);
  }

  private async recordAudit(
    action: string,
    connection: ConnectionRecord,
    actor: { actorId?: string },
  ): Promise<void> {
    await this.auditService.record({
      tenantId: connection.tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'connection',
      entityId: connection.id,
      metadata: {
        type: connection.type,
        authType: connection.authType,
        status: connection.status,
        hasCredentialReference: Boolean(connection.credentialRef),
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(connection: ConnectionRecord): ConnectionResponseDto {
    return {
      id: connection.id,
      tenantId: connection.tenantId,
      name: connection.name,
      type: connection.type,
      baseUrl: connection.baseUrl,
      authType: connection.authType,
      hasCredentialReference: Boolean(connection.credentialRef),
      allowedHeaders: connection.allowedHeaders,
      metadata: connection.metadata,
      status: connection.status,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }
}
