import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';

import { AppConfigService } from '../../../config/app-config.service';
import { DELFOS_ADMIN_KEY_HEADER } from '../constants/auth-headers';
import { RequestAuthContextService } from '../services/request-auth-context.service';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(
    private readonly config: AppConfigService,
    private readonly requestAuthContextService: RequestAuthContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const providedKey = this.readHeader(request, DELFOS_ADMIN_KEY_HEADER);

    if (!providedKey || !this.matchesAdminKey(providedKey)) {
      throw new UnauthorizedException('Authentication required.');
    }

    request.delfosAuthContext = this.requestAuthContextService.extract(request);

    return true;
  }

  private matchesAdminKey(providedKey: string): boolean {
    const expectedKey = this.config.adminKey;
    const expectedDigest = createHash('sha256').update(expectedKey, 'utf8').digest();
    const providedDigest = createHash('sha256').update(providedKey, 'utf8').digest();

    return timingSafeEqual(expectedDigest, providedDigest);
  }

  private readHeader(request: Request, headerName: string): string | undefined {
    const header = request.headers[headerName];
    const value = Array.isArray(header) ? header[0] : header;

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }
}
