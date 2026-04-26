import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { sanitizeMetadata } from '../../../core/utils/sanitize-metadata';
import { AuditService } from '../../audit/services/audit.service';
import { ConnectionResponseDto } from '../dto/connection-response.dto';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { ConnectionsRepository } from '../repositories/connections.repository';
import { ConnectionDocument } from '../schemas/connection.schema';

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
      tenantId: new Types.ObjectId(dto.tenantId),
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
    const tenantObjectId = new Types.ObjectId(tenantId);
    const [items, total] = await Promise.all([
      this.connectionsRepository.findByTenant(tenantObjectId, page, pageSize),
      this.connectionsRepository.countByTenant(tenantObjectId),
    ]);

    return {
      items: items.map((connection) => this.toResponse(connection)),
      meta: buildListMeta(page, pageSize, total),
    };
  }

  async findOne(tenantId: string, id: string): Promise<ConnectionResponseDto> {
    const connection = await this.connectionsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

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
    const connection = await this.connectionsRepository.updateByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      {
        ...dto,
        metadata: dto.metadata ? sanitizeMetadata(dto.metadata) : undefined,
      },
    );

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    await this.recordAudit('connection.updated', connection, actor);

    return this.toResponse(connection);
  }

  private async recordAudit(
    action: string,
    connection: ConnectionDocument,
    actor: { actorId?: string },
  ): Promise<void> {
    await this.auditService.record({
      tenantId: connection.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'connection',
      entityId: connection._id.toString(),
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

  private toResponse(connection: ConnectionDocument): ConnectionResponseDto {
    return {
      id: connection._id.toString(),
      tenantId: connection.tenantId.toString(),
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
