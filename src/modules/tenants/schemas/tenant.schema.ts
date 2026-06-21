// Domain enums for the tenants module. Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.

export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
}
