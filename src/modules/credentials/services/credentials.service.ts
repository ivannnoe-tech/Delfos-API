import { Injectable, NotFoundException } from '@nestjs/common';

import { buildListMeta, ListResponse } from '../../../core/dto/list-meta.dto';
import { AuditService } from '../../audit/services/audit.service';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { CredentialResponseDto } from '../dto/credential-response.dto';
import { ListCredentialsQueryDto } from '../dto/credential-query.dto';
import { RotateCredentialDto } from '../dto/rotate-credential.dto';
import { CredentialRecord, CredentialsRepository } from '../repositories/credentials.repository';
import { CredentialStatus } from '../schemas/credential.constants';
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
      tenantId: dto.tenantId,
      connectionId: dto.connectionId,
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
      tenantId: query.tenantId,
      connectionId: query.connectionId,
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
    const credential = await this.credentialsRepository.findByTenantAndId(tenantId, id);

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
    const credential = await this.credentialsRepository.rotateByTenantAndId(tenantId, id, {
      maskedPreview: protectedCredential.maskedPreview,
      protectedSecretValue: protectedCredential.protectedValue,
      protectionProvider: protectedCredential.provider,
      rotatedAt: new Date(),
      status: CredentialStatus.Active,
      updatedBy: actor.actorId,
    });

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
    const credential = await this.credentialsRepository.revokeByTenantAndId(tenantId, id, {
      status: CredentialStatus.Revoked,
      revokedAt: new Date(),
      updatedBy: actor.actorId,
    });

    if (!credential) {
      throw new NotFoundException('Credential not found.');
    }

    await this.recordAudit('credential.revoked', credential, actor);

    return this.toResponse(credential);
  }

  private async recordAudit(
    action: string,
    credential: CredentialRecord,
    actor: CredentialActorContext,
  ): Promise<void> {
    await this.auditService.record({
      tenantId: credential.tenantId,
      actorUserId: this.toAuditActorUserId(actor.actorId),
      action,
      entity: 'credential',
      entityId: credential.id,
      metadata: {
        type: credential.type,
        status: credential.status,
        provider: credential.provider ?? null,
        connectionId: credential.connectionId ?? null,
      },
    });
  }

  private toAuditActorUserId(actorId: string | undefined): string | undefined {
    if (!actorId || !/^[0-9a-f]{24}$/i.test(actorId)) {
      return undefined;
    }

    return actorId;
  }

  private toResponse(credential: CredentialRecord): CredentialResponseDto {
    return {
      id: credential.id,
      credentialRef: this.toCredentialRef(credential.id),
      tenantId: credential.tenantId,
      connectionId: credential.connectionId,
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

  private toCredentialRef(id: string): string {
    return `cred_${id}`;
  }
}
