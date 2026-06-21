/* eslint-disable @typescript-eslint/no-explicit-any -- Kysely migrations use the canonical `Kysely<any>` signature so they stay decoupled from the generated schema type. */
import { Kysely, sql } from 'kysely';

/**
 * P2 migration 0001 — core identity tables (ADR-0035 / ADR-0036).
 *
 * Creates `tenants` (global, no tenant_id) and `users`. `tenants` must exist
 * first so every later tenant-scoped table can reference it via FK.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('tenants')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('tenants_slug_key', ['slug'])
    .execute();

  await db.schema.createIndex('tenants_status_idx').on('tenants').column('status').execute();

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.notNull().defaultTo('viewer'))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('invited'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('users_tenant_id_email_key', ['tenant_id', 'email'])
    .execute();

  await db.schema
    .createIndex('users_tenant_id_status_idx')
    .on('users')
    .columns(['tenant_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('tenants').ifExists().execute();
}
