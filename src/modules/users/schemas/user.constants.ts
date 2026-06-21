// Domain enums for the users module. Mongoose schema removed in P5 (ADR-0035).

export enum UserRole {
  Owner = 'owner',
  Admin = 'admin',
  Operator = 'operator',
  Viewer = 'viewer',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
}
