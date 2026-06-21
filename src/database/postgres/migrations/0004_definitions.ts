/* eslint-disable @typescript-eslint/no-explicit-any -- Kysely migrations use the canonical `Kysely<any>` signature so they stay decoupled from the generated schema type. */
import { Kysely, sql } from 'kysely';

/**
 * P2 migration 0004 — catalog definitions (ADR-0035 / ADR-0036).
 *
 * Creates query_definitions, dashboard_definitions, report_definitions and
 * semantic_models. `query_definitions.dataset_id` is a real FK to datasets
 * (ON DELETE RESTRICT); the report_definitions definition references are
 * logical (uuid column, no FK), but indexed where the source indexes them.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('query_definitions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('dataset_id', 'uuid', (col) =>
      col.notNull().references('datasets.id').onDelete('restrict'),
    )
    .addColumn('query_key', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('type', 'text', (col) => col.notNull().defaultTo('table'))
    .addColumn('metrics', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('dimensions', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('filters', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('sorts', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('default_limit', 'integer')
    .addColumn('time_field', 'text')
    .addColumn('allowed_granularities', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('tags', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('query_definitions_tenant_id_query_key_key', ['tenant_id', 'query_key'])
    .execute();

  await db.schema
    .createIndex('query_definitions_tenant_id_dataset_id_idx')
    .on('query_definitions')
    .columns(['tenant_id', 'dataset_id'])
    .execute();

  await db.schema
    .createIndex('query_definitions_tenant_id_status_idx')
    .on('query_definitions')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('query_definitions_tenant_id_type_idx')
    .on('query_definitions')
    .columns(['tenant_id', 'type'])
    .execute();

  await db.schema
    .createTable('dashboard_definitions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('dashboard_key', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('tenant'))
    .addColumn('layout', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('sections', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('widgets', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('filters', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('tags', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('dashboard_definitions_tenant_id_dashboard_key_key', [
      'tenant_id',
      'dashboard_key',
    ])
    .execute();

  await db.schema
    .createIndex('dashboard_definitions_tenant_id_status_idx')
    .on('dashboard_definitions')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('dashboard_definitions_tenant_id_visibility_idx')
    .on('dashboard_definitions')
    .columns(['tenant_id', 'visibility'])
    .execute();

  await db.schema
    .createTable('report_definitions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('report_key', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('tenant'))
    .addColumn('query_definition_id', 'uuid')
    .addColumn('dashboard_definition_id', 'uuid')
    .addColumn('layout', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('sections', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('blocks', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('filters', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('parameters', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('export_options', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('tags', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('report_definitions_tenant_id_report_key_key', ['tenant_id', 'report_key'])
    .execute();

  await db.schema
    .createIndex('report_definitions_tenant_id_status_idx')
    .on('report_definitions')
    .columns(['tenant_id', 'status'])
    .execute();

  await db.schema
    .createIndex('report_definitions_tenant_id_visibility_idx')
    .on('report_definitions')
    .columns(['tenant_id', 'visibility'])
    .execute();

  await db.schema
    .createIndex('report_definitions_tenant_id_query_definition_id_idx')
    .on('report_definitions')
    .columns(['tenant_id', 'query_definition_id'])
    .execute();

  await db.schema
    .createIndex('report_definitions_tenant_id_dashboard_definition_id_idx')
    .on('report_definitions')
    .columns(['tenant_id', 'dashboard_definition_id'])
    .execute();

  await db.schema
    .createTable('semantic_models')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tenant_id', 'uuid', (col) =>
      col.notNull().references('tenants.id').onDelete('restrict'),
    )
    .addColumn('model_key', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('dataset_keys', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('owner', 'text')
    .addColumn('steward', 'text')
    .addColumn('certification_owner', 'text')
    .addColumn('tags', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('quality', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('measures', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('dimensions', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('glossary_terms', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'text')
    .addColumn('updated_by', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('semantic_models_tenant_id_model_key_key', ['tenant_id', 'model_key'])
    .execute();

  await db.schema
    .createIndex('semantic_models_tenant_id_status_idx')
    .on('semantic_models')
    .columns(['tenant_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('semantic_models').ifExists().execute();
  await db.schema.dropTable('report_definitions').ifExists().execute();
  await db.schema.dropTable('dashboard_definitions').ifExists().execute();
  await db.schema.dropTable('query_definitions').ifExists().execute();
}
