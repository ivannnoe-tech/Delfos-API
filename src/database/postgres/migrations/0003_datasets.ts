/* eslint-disable @typescript-eslint/no-explicit-any -- Kysely migrations use the canonical `Kysely<any>` signature so they stay decoupled from the generated schema type. */
import { Kysely, sql } from 'kysely';

/**
 * P2 migration 0003 — datasets and field_mappings (ADR-0035 / ADR-0036).
 *
 * Both carry a nullable FK to `connections` (ON DELETE SET NULL).
 * `field_mappings.dataset_key` is a logical reference (string, no FK).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('datasets')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('connection_id', 'uuid', (col) =>
      col.references('connections.id').onDelete('set null'),
    )
    .addColumn('dataset_key', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('source_type', 'text', (col) => col.notNull().defaultTo('api'))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('refresh_mode', 'text', (col) => col.notNull().defaultTo('manual'))
    .addColumn('schema_mode', 'text', (col) => col.notNull().defaultTo('declared'))
    .addColumn('fields', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('primary_key_fields', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('time_field', 'text')
    .addColumn('tags', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('datasets_tenant_id_dataset_key_key', ['tenant_id', 'dataset_key'])
    .execute();

  await db.schema
    .createIndex('datasets_tenant_id_connection_id_idx')
    .on('datasets')
    .columns(['tenant_id', 'connection_id'])
    .execute();

  await db.schema
    .createIndex('datasets_tenant_id_status_idx')
    .on('datasets')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('datasets_tenant_id_source_type_idx')
    .on('datasets')
    .columns(['tenant_id', 'source_type'])
    .execute();

  await db.schema
    .createTable('field_mappings')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('connection_id', 'uuid', (col) =>
      col.references('connections.id').onDelete('set null'),
    )
    .addColumn('dataset_key', 'text', (col) => col.notNull())
    .addColumn('source_path', 'text', (col) => col.notNull())
    .addColumn('target_field', 'text', (col) => col.notNull())
    .addColumn('target_type', 'text', (col) => col.notNull())
    .addColumn('required', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('transform', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('field_mappings_tenant_id_dataset_key_target_field_key', [
      'tenant_id',
      'dataset_key',
      'target_field',
    ])
    .execute();

  await db.schema
    .createIndex('field_mappings_tenant_id_connection_id_idx')
    .on('field_mappings')
    .columns(['tenant_id', 'connection_id'])
    .execute();

  await db.schema
    .createIndex('field_mappings_tenant_id_status_idx')
    .on('field_mappings')
    .columns(['tenant_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('field_mappings').ifExists().execute();
  await db.schema.dropTable('datasets').ifExists().execute();
}
