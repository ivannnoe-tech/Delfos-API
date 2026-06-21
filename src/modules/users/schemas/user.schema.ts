// Domain enums for the users module. Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.

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
