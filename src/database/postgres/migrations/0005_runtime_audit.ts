/* eslint-disable @typescript-eslint/no-explicit-any -- Kysely migrations use the canonical `Kysely<any>` signature so they stay decoupled from the generated schema type. */
import { Kysely, sql } from 'kysely';

/**
 * P2 migration 0005 — runtime + audit tables (ADR-0035 / ADR-0036).
 *
 * `execution_requests` (logical definition references, no FK),
 * `execution_request_events` (real FK → execution_requests ON DELETE CASCADE,
 * created_at only), and `audit_logs` (created_at only; actor_user_id logical).
 * DESC indexes are created with raw `sql` since the schema builder has no
 * direct column-direction modifier.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('execution_requests')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('request_key', 'text', (col) => col.notNull())
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('accepted'))
    .addColumn('query_definition_id', 'uuid')
    .addColumn('dashboard_definition_id', 'uuid')
    .addColumn('report_definition_id', 'uuid')
    .addColumn('connection_id', 'uuid')
    .addColumn('dataset_id', 'uuid')
    .addColumn('requested_by_actor_id', 'text')
    .addColumn('requested_by_role', 'text')
    .addColumn('mode', 'text', (col) => col.notNull().defaultTo('future_runtime'))
    .addColumn('reason', 'text')
    .addColumn('message', 'text')
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('execution_requests_tenant_id_request_key_key', [
      'tenant_id',
      'request_key',
    ])
    .execute();

  await sql`
    CREATE INDEX "execution_requests_tenant_id_created_at_idx"
    ON "execution_requests" ("tenant_id", "created_at" DESC)
  `.execute(db);

  await db.schema
    .createIndex('execution_requests_tenant_id_status_idx')
    .on('execution_requests')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('execution_requests_tenant_id_kind_idx')
    .on('execution_requests')
    .columns(['tenant_id', 'kind'])
    .execute();

  await db.schema
    .createIndex('execution_requests_tenant_id_query_definition_id_idx')
    .on('execution_requests')
    .columns(['tenant_id', 'query_definition_id'])
    .execute();

  await db.schema
    .createIndex('execution_requests_tenant_id_dashboard_definition_id_idx')
    .on('execution_requests')
    .columns(['tenant_id', 'dashboard_definition_id'])
    .execute();

  await db.schema
    .createIndex('execution_requests_tenant_id_report_definition_id_idx')
    .on('execution_requests')
    .columns(['tenant_id', 'report_definition_id'])
    .execute();

  await db.schema
    .createTable('execution_request_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('execution_request_id', 'uuid', (col) =>
      col.notNull().references('execution_requests.id').onDelete('cascade'),
    )
    .addColumn('request_key', 'text', (col) => col.notNull())
    .addColumn('event_type', 'text', (col) => col.notNull())
    .addColumn('previous_status', 'text')
    .addColumn('next_status', 'text')
    .addColumn('message', 'text')
    .addColumn('reason', 'text')
    .addColumn('actor_id', 'text')
    .addColumn('actor_role', 'text')
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`
    CREATE INDEX "execution_request_events_tenant_id_execution_request_id_idx"
    ON "execution_request_events" ("tenant_id", "execution_request_id", "created_at" DESC)
  `.execute(db);

  await sql`
    CREATE INDEX "execution_request_events_tenant_id_request_key_idx"
    ON "execution_request_events" ("tenant_id", "request_key", "created_at" DESC)
  `.execute(db);

  await db.schema
    .createIndex('execution_request_events_tenant_id_event_type_idx')
    .on('execution_request_events')
    .columns(['tenant_id', 'event_type'])
    .execute();

  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('actor_user_id', 'uuid')
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('entity', 'text', (col) => col.notNull())
    .addColumn('entity_id', 'text')
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`
    CREATE INDEX "audit_logs_tenant_id_created_at_idx"
    ON "audit_logs" ("tenant_id", "created_at" DESC)
  `.execute(db);

  await db.schema
    .createIndex('audit_logs_tenant_id_entity_entity_id_idx')
    .on('audit_logs')
    .columns(['tenant_id', 'entity', 'entity_id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('audit_logs').ifExists().execute();
  await db.schema.dropTable('execution_request_events').ifExists().execute();
  await db.schema.dropTable('execution_requests').ifExists().execute();
}
