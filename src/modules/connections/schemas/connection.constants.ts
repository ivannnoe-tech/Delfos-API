// Domain enums for the connections module. Mongoose schema removed in P5 (ADR-0035).

export enum ConnectionAuthType {
  None = 'none',
  ApiKeyHeader = 'api_key_header',
  BearerToken = 'bearer_token',
  Basic = 'basic',
  OAuth2ClientCredentials = 'oauth2_client_credentials',
}

export enum ConnectionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
}

export enum ConnectionType {
  CustomerApi = 'customer_api',
}
