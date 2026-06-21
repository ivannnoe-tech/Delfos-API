// Domain enums for the credentials module. Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.

export enum CredentialStatus {
  Active = 'active',
  Inactive = 'inactive',
  Revoked = 'revoked',
}

export enum CredentialType {
  ApiKey = 'api_key',
  BearerToken = 'bearer_token',
  BasicAuth = 'basic_auth',
  OAuthClient = 'oauth_client',
  DatabaseConnectionString = 'database_connection_string',
  Custom = 'custom',
}
