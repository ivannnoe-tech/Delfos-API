import { SetMetadata } from '@nestjs/common';

import { AdminRole } from '../types/admin-role';

export const ADMIN_ROLES_KEY = 'delfos:admin-roles';

export const AdminRoles = (...roles: AdminRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
