/**
 * PostgreSQL schema types for Kysely (ADR-0035 / ADR-0036).
 *
 * Empty of tables during P1: only the connection/health-check exist yet. Tables
 * are introduced in P2 (schema + migrations) and these types will be generated
 * from the live schema via `kysely-codegen`. The index signature keeps the type
 * valid (and non-empty for lint) while no concrete tables are declared.
 */
export interface DB {
  [table: string]: Record<string, never>;
}
