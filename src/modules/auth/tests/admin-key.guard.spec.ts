import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { AppConfigService } from '../../../config/app-config.service';
import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
  DELFOS_TENANT_ID_HEADER,
} from '../constants/auth-headers';
import { AdminKeyGuard } from '../guards/admin-key.guard';
import { RequestAuthContextService } from '../services/request-auth-context.service';
import { AdminRole } from '../types/admin-role';
import { AuthenticatedRequest } from '../types/authenticated-request';

describe('AdminKeyGuard', () => {
  const adminKey = 'test-admin-key-not-a-real-secret';

  it('rejects requests without admin key header', () => {
    const guard = createGuard(adminKey);
    const request = createRequest({});

    expect(() => guard.canActivate(createExecutionContext(request))).toThrow(UnauthorizedException);
  });

  it('rejects requests with incorrect admin key header', () => {
    const guard = createGuard(adminKey);
    const request = createRequest({
      [DELFOS_ADMIN_KEY_HEADER]: 'wrong-admin-key-not-a-real-secret',
    });

    expect(() => guard.canActivate(createExecutionContext(request))).toThrow(UnauthorizedException);
  });

  it('accepts a valid admin key and attaches request auth context', () => {
    const guard = createGuard(adminKey);
    const request = createRequest({
      [DELFOS_ADMIN_KEY_HEADER]: adminKey,
      [DELFOS_TENANT_ID_HEADER]: '662d4f6e7a1c2b00124f0001',
      [DELFOS_ACTOR_ID_HEADER]: 'dev-actor-001',
      [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Admin,
    });

    expect(guard.canActivate(createExecutionContext(request))).toBe(true);
    expect(request.delfosAuthContext).toEqual({
      tenantId: '662d4f6e7a1c2b00124f0001',
      actorId: 'dev-actor-001',
      actorRole: AdminRole.Admin,
    });
  });
});

function createGuard(adminKey: string): AdminKeyGuard {
  const config = {
    get adminKey(): string {
      return adminKey;
    },
  } as AppConfigService;

  return new AdminKeyGuard(config, new RequestAuthContextService());
}

function createRequest(headers: Record<string, string>): AuthenticatedRequest {
  return {
    headers,
  } as Request as AuthenticatedRequest;
}

function createExecutionContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}
