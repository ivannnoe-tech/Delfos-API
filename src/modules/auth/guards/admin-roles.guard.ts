import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRole } from '../types/admin-role';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actorRole = request.delfosAuthContext?.actorRole;

    if (!actorRole || !requiredRoles.includes(actorRole)) {
      throw new ForbiddenException('Forbidden.');
    }

    return true;
  }
}
