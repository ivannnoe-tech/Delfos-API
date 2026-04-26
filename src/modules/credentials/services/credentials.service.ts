import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { AuditService } from '../../audit/services/audit.service';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { CredentialResponseDto } from '../dto/credential-response.dto';
import { ListCredentialsQueryDto } from '../dto/credential-query.dto';
import { RotateCredentialDto } from '../dto/rotate-credential.dto';
import { CredentialsRepository } from '../repositories/credentials.repository';
import { CredentialDocument, CredentialStatus } from '../schemas/credential.schema';
import { LocalCredentialProtectorService } from './local-credential-protector.service';

export interface CredentialActorContext {
  actorId?: string;
}

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly credentialProtector: LocalCredentialProtectorService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateCredentialDto,
    actor: CredentialActorContext = {},
  ): Promise<CredentialResponseDto> {
    const protectedCredential = this.credentialProtector.protect(dto.secretValue);
    const credential = await this.credentialsRepository.create({
      tenantId: new Types.ObjectId(dto.tenantId),
      connectionId: dto.connectionId ? new Types.ObjectId(dto.connectionId) : undefined,
      type: dto.type,
      provider: dto.provider,
      name: dto.name,
      status: CredentialStatus.Active,
      maskedPreview: protectedCredential.maskedPreview,
      protectedSecretValue: protectedCredential.protectedValue,
      protectionProvider: protectedCredential.provider,
      createdBy: actor.actorId,
      updatedBy: actor.actorId,
    });

    await this.recordAudit('credential.created', credential, actor);

    return this.toResponse(credential);
  }

  async findByFilters(
    query: ListCredentialsQueryDto,
  ): Promise<ListResponse<CredentialResponseDto>> {
    const filters = {
      tenantId: new Types.ObjectId(query.tenantId),
      connectionId: query.connectionId ? new Types.ObjectId(query.connectionId) : undefined,
    };
    const [items, total] = await Promise.all([
      this.credentialsRepository.findByFilters(filters, query.page, query.pageSize),
      this.credentialsRepository.countByFilters(filters),
    ]);

    return {
      items: items.map((credential) => this.toResponse(credential)),
      meta: buildListMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(tenantId: string, id: string): Promise<CredentialResponseDto> {
    const credential = await this.credentialsRepository.findByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
    );

    if (!credential) {
      throw new NotFoundException('Credential not found.');
    }

    return this.toResponse(credential);
  }

  async rotate(
    tenantId: string,
    id: string,
    dto: RotateCredentialDto,
    actor: CredentialActorContext = {},
  ): Promise<CredentialResponseDto> {
    const protectedCredential = this.credentialProtector.protect(dto.secretValue);
    const credential = await this.credentialsRepository.rotateByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      {
        maskedPreview: protectedCredential.maskedPreview,
        protectedSecretValue: protectedCredential.protectedValue,
        protectionProvider: protectedCredential.provider,
        rotatedAt: new Date(),
        status: CredentialStatus.Active,
        updatedBy: actor.actorId,
      },
    );

    if (!credential) {
      throw new NotFoundException('Credential not found.');
    }

    await this.recordAudit('credential.rotated', credential, actor);

    return this.toResponse(credential);
  }

  async revoke(
    tenantId: string,
    id: string,
    actor: CredentialActorContext = {},
  ): Promise<CredentialResponseDto> {
    const credential = await this.credentialsRepository.revokeByTenantAndId(
      new Types.ObjectId(tenantId),
      id,
      {
        status: CredentialStatus.Revoked,
        revokedAt: new Date(),
        updatedBy: actor.actorId,
      },
    );

    if (!credential) {
      throw new NotFoundException('Credential not found.');
    }

    await this.recordAudit('credential.revoked', credential, actor);

    return this.toResponse(credential);
  }

  private async recordAudit(
    action: string,
    credential: CredentialDocument,
    actor: CredentialActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: credential.tenantId.toString(),
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'credential',
      entityId: credential._id.toString(),
      metadata: {
        type: credential.type,
        status: credential.status,
        provider: credential.provider ?? null,
        connectionId: credential.connectionId?.toString() ?? null,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(credential: CredentialDocument): CredentialResponseDto {
    return {
      id: credential._id.toString(),
      credentialRef: this.toCredentialRef(credential._id),
      tenantId: credential.tenantId.toString(),
      connectionId: credential.connectionId?.toString(),
      type: credential.type,
      provider: credential.provider,
      name: credential.name,
      status: credential.status,
      maskedPreview: credential.maskedPreview,
      createdAt: credential.createdAt.toISOString(),
      updatedAt: credential.updatedAt.toISOString(),
      rotatedAt: credential.rotatedAt?.toISOString(),
      revokedAt: credential.revokedAt?.toISOString(),
      createdBy: credential.createdBy,
      updatedBy: credential.updatedBy,
    };
  }

  private toCredentialRef(id: Types.ObjectId): string {
    return `cred_${id.toString()}`;
  }
}
