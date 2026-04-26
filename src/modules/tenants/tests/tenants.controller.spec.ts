import 'reflect-metadata';

import { ADMIN_ROLES_KEY } from '../../auth/decorators/admin-roles.decorator';
import { AdminRole } from '../../auth/types/admin-role';
import { TenantsController } from '../controllers/tenants.controller';

describe('TenantsController roles', () => {
  it('allows operator role for tenant mutations in the foundation checkpoint', () => {
    expect(getAdminRoles('create')).toEqual([AdminRole.Owner, AdminRole.Admin, AdminRole.Operator]);
    expect(getAdminRoles('update')).toEqual([AdminRole.Owner, AdminRole.Admin, AdminRole.Operator]);
  });
});

function getAdminRoles(methodName: 'create' | 'update'): AdminRole[] | undefined {
  const roles = Reflect.getMetadata(
    ADMIN_ROLES_KEY,
    TenantsController.prototype[methodName],
  ) as unknown;

  return Array.isArray(roles) ? (roles as AdminRole[]) : undefined;
}
