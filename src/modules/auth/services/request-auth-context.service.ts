import { BadRequestException, Injectable } from '@nestjs/common';
import { isMongoId, isUUID } from 'class-validator';
import { Request } from 'express';

import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_TENANT_ID_HEADER,
} from '../constants/auth-headers';
import { ADMIN_ROLES, AdminRole } from '../types/admin-role';
import { RequestAuthContext } from '../types/request-auth-context';

@Injectable()
export class RequestAuthContextService {
  extract(request: Request): RequestAuthContext {
    const tenantId = this.readOptionalHeader(request, DELFOS_TENANT_ID_HEADER);
    const actorId = this.readOptionalHeader(request, DELFOS_ACTOR_ID_HEADER);
    const actorRole = this.readOptionalHeader(request, DELFOS_ACTOR_ROLE_HEADER);

    if (tenantId && !this.isValidTenantId(tenantId)) {
      throw new BadRequestException('Invalid tenant context.');
    }

    if (actorId && !this.isSafeActorId(actorId)) {
      throw new BadRequestException('Invalid actor context.');
    }

    if (actorRole && !this.isAdminRole(actorRole)) {
      throw new BadRequestException('Invalid actor context.');
    }

    return {
      tenantId,
      actorId,
      actorRole: actorRole as AdminRole | undefined,
    };
  }

  private readOptionalHeader(request: Request, headerName: string): string | undefined {
    const header = request.headers[headerName];
    const value = Array.isArray(header) ? header[0] : header;

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private isValidTenantId(value: string): boolean {
    // Accept a legacy Mongo ObjectId (24-hex) and a PostgreSQL UUID, mirroring
    // @IsEntityId so the tenant header stays valid across the MongoDB → PostgreSQL
    // migration and after it (ADR-0035 / ADR-0036, P5).
    return isMongoId(value) || isUUID(value);
  }

  private isSafeActorId(value: string): boolean {
    return value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value);
  }

  private isAdminRole(value: string): value is AdminRole {
    return ADMIN_ROLES.includes(value as AdminRole);
  }
}
