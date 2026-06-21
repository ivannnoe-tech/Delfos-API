/**
 * DI token for the shared Kysely instance (ADR-0035 / ADR-0036).
 *
 * Resolves to `Kysely<DB>` when `DELFOS_POSTGRES_URL` is configured, or `null`
 * when Postgres is not configured (the API still runs on MongoDB during the
 * phased migration). Inject with `@Inject(KYSELY_DB)`.
 */
export const KYSELY_DB = Symbol('KYSELY_DB');
