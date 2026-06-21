/* eslint-disable @typescript-eslint/no-explicit-any -- Kysely migrations use the canonical `Kysely<any>` signature so they stay decoupled from the generated schema type. */
import { Kysely, sql } from 'kysely';

/**
 * P2 migration 0002 — connections and credentials (ADR-0035 / ADR-0036).
 *
 * `connections` must exist before `credentials` because the latter has a
 * nullable FK to it (ON DELETE SET NULL).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('connections')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull().defaultTo('customer_api'))
    .addColumn('base_url', 'text', (col) => col.notNull())
    .addColumn('auth_type', 'text', (col) => col.notNull().defaultTo('none'))
    .addColumn('credential_ref', 'text')
    .addColumn('allowed_headers', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('connections_tenant_id_name_key', ['tenant_id', 'name'])
    .execute();

  await db.schema
    .createIndex('connections_tenant_id_status_idx')
    .on('connections')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('connections_tenant_id_type_idx')
    .on('connections')
    .columns(['tenant_id', 'type'])
    .execute();

  await db.schema
    .createTable('credentials')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('connection_id', 'uuid', (col) =>
      col.references('connections.id').onDelete('set null'),
    )
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('provider', 'text')
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('masked_preview', 'text')
    .addColumn('protected_secret_value', 'text', (col) => col.notNull())
    .addColumn('protection_provider', 'text', (col) => col.notNull())
    .addColumn('rotated_at', 'timestamptz')
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('credentials_tenant_id_connection_id_idx')
    .on('credentials')
    .columns(['tenant_id', 'connection_id'])
    .execute();

  await db.schema
    .createIndex('credentials_tenant_id_status_idx')
    .on('credentials')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('credentials_tenant_id_type_idx')
    .on('credentials')
    .columns(['tenant_id', 'type'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('credentials').ifExists().execute();
  await db.schema.dropTable('connections').ifExists().execute();
}
