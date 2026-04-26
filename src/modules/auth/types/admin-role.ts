export enum AdminRole {
  Owner = 'owner',
  Admin = 'admin',
  Operator = 'operator',
  Viewer = 'viewer',
}

export const ADMIN_ROLES = Object.values(AdminRole);
