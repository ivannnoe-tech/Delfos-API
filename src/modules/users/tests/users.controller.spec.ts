import 'reflect-metadata';

import { ADMIN_ROLES_KEY } from '../../auth/decorators/admin-roles.decorator';
import { AdminRole } from '../../auth/types/admin-role';
import { UsersController } from '../controllers/users.controller';

describe('UsersController roles', () => {
  it('allows operator role for user mutations in the foundation checkpoint', () => {
    expect(getAdminRoles('create')).toEqual([AdminRole.Owner, AdminRole.Admin, AdminRole.Operator]);
    expect(getAdminRoles('update')).toEqual([AdminRole.Owner, AdminRole.Admin, AdminRole.Operator]);
  });
});

function getAdminRoles(methodName: 'create' | 'update'): AdminRole[] | undefined {
  const roles = Reflect.getMetadata(
    ADMIN_ROLES_KEY,
    UsersController.prototype[methodName],
  ) as unknown;

  return Array.isArray(roles) ? (roles as AdminRole[]) : undefined;
}
