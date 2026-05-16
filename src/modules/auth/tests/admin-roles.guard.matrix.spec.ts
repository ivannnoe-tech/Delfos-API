import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import 'reflect-metadata';

import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRole } from '../types/admin-role';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Reinforces the temporary foundation role matrix (ADR-0017) for the
 * AdminRolesGuard. The existing admin-roles.guard.spec.ts covers no-roles,
 * allowed and viewer-denied cases; this file adds the operator role behavior
 * and exercises the real @AdminRoles decorator instead of raw metadata.
 */
describe('AdminRolesGuard — role matrix', () => {
  it('grants viewer when an endpoint allows the viewer role', () => {
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin, AdminRole.Viewer);
    const guard = new AdminRolesGuard(new Reflector());

    expect(guard.canActivate(createContext(handler, AdminRole.Viewer))).toBe(true);
  });

  it('denies viewer on a mutation endpoint restricted to owner/admin/operator', () => {
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator);
    const guard = new AdminRolesGuard(new Reflector());

    expect(() => guard.canActivate(createContext(handler, AdminRole.Viewer))).toThrow(
      ForbiddenException,
    );
  });

  it('grants operator on a catalog mutation endpoint that allows operator', () => {
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator);
    const guard = new AdminRolesGuard(new Reflector());

    expect(guard.canActivate(createContext(handler, AdminRole.Operator))).toBe(true);
  });

  it('denies operator on a credentials endpoint restricted to owner/admin', () => {
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin);
    const guard = new AdminRolesGuard(new Reflector());

    expect(() => guard.canActivate(createContext(handler, AdminRole.Operator))).toThrow(
      ForbiddenException,
    );
  });

  it.each([AdminRole.Owner, AdminRole.Admin])(
    'grants %s on a security-sensitive endpoint',
    (role) => {
      const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin);
      const guard = new AdminRolesGuard(new Reflector());

      expect(guard.canActivate(createContext(handler, role))).toBe(true);
    },
  );

  it('denies a request whose actor role is absent from the auth context', () => {
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator);
    const guard = new AdminRolesGuard(new Reflector());

    expect(() => guard.canActivate(createContext(handler, undefined))).toThrow(ForbiddenException);
  });

  it('reads class-level @AdminRoles metadata when the handler has none', () => {
    const guard = new AdminRolesGuard(new Reflector());

    @AdminRoles(AdminRole.Owner, AdminRole.Admin)
    class ClassScopedController {}

    const handler = function handler(): void {};
    const operatorContext = createContext(handler, AdminRole.Operator, ClassScopedController);
    const adminContext = createContext(handler, AdminRole.Admin, ClassScopedController);

    expect(() => guard.canActivate(operatorContext)).toThrow(ForbiddenException);
    expect(guard.canActivate(adminContext)).toBe(true);
  });

  it('lets handler-level @AdminRoles metadata override class-level metadata', () => {
    const guard = new AdminRolesGuard(new Reflector());

    @AdminRoles(AdminRole.Owner)
    class RestrictedController {}

    // Handler metadata allows operator; class metadata only allows owner.
    const handler = decorateHandler(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator);
    const context = createContext(handler, AdminRole.Operator, RestrictedController);

    // Handler metadata (allows operator) must win over the stricter class metadata.
    expect(guard.canActivate(context)).toBe(true);
  });
});

function decorateHandler(...roles: AdminRole[]): () => void {
  const handler = function handler(): void {};
  const decorate: MethodDecorator = AdminRoles(...roles);
  decorate({}, 'handler', { value: handler });

  return handler;
}

function createContext(
  handler: () => void,
  actorRole: AdminRole | undefined,
  controllerClass: new () => unknown = class TestController {},
): ExecutionContext {
  const request = {
    delfosAuthContext: { actorRole },
  } as AuthenticatedRequest;

  return {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}
