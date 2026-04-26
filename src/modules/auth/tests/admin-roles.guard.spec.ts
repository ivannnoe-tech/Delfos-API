import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import 'reflect-metadata';

import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRole } from '../types/admin-role';
import { AuthenticatedRequest } from '../types/authenticated-request';

describe('AdminRolesGuard', () => {
  it('allows requests when no roles are required', () => {
    const guard = new AdminRolesGuard(new Reflector());
    const handler = function handler(): void {};
    const request = createRequest();

    expect(guard.canActivate(createExecutionContext(handler, request))).toBe(true);
  });

  it('allows requests when actor role is included in required roles', () => {
    const guard = new AdminRolesGuard(new Reflector());
    const handler = function handler(): void {};
    Reflect.defineMetadata(ADMIN_ROLES_KEY, [AdminRole.Owner, AdminRole.Admin], handler);
    const request = createRequest(AdminRole.Admin);

    expect(guard.canActivate(createExecutionContext(handler, request))).toBe(true);
  });

  it('rejects requests when actor role is missing or not allowed', () => {
    const guard = new AdminRolesGuard(new Reflector());
    const handler = function handler(): void {};
    Reflect.defineMetadata(ADMIN_ROLES_KEY, [AdminRole.Owner, AdminRole.Admin], handler);
    const request = createRequest(AdminRole.Viewer);

    expect(() => guard.canActivate(createExecutionContext(handler, request))).toThrow(
      ForbiddenException,
    );
  });
});

function createRequest(actorRole?: AdminRole): AuthenticatedRequest {
  return {
    delfosAuthContext: {
      actorRole,
    },
  } as AuthenticatedRequest;
}

function createExecutionContext(
  handler: () => void,
  request: AuthenticatedRequest,
): ExecutionContext {
  class TestController {}

  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}
