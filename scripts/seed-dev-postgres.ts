import { Kysely } from 'kysely';
import { Types } from 'mongoose';

import { DB } from '../src/database/postgres/database.types';
import { ProtectedCredentialValue } from '../src/modules/credentials/services/local-credential-protector.service';
import {
  buildDashboardInput,
  buildDatasetInputs,
  buildFieldMappingInputs,
  buildQueryFilter,
  buildQueryInputs,
  buildQuerySorts,
  buildReportInput,
  buildSemanticModelInputs,
  demoActorId,
  demoAllowedGranularities,
  demoSeedKeys,
} from './seed-dev-data';

/**
 * PostgreSQL seed path (ADR-0035 / ADR-0036, P4).
 *
 * Mirrors the Mongoose dev seed: the SAME fictitious foundation data, keyed on
 * the SAME stable business keys, written idempotently via `onConflict(...)
 * .doUpdateSet(...)`. Cross-references use the generated UUIDs returned by each
 * upsert (Postgres `id`s are UUIDs, not ObjectIds), so re-running is stable.
 *
 * No secret is printed and no real secret is stored — only the protected value
 * the caller passes in. Used only when `DELFOS_POSTGRES_URL` is configured.
 */

interface SeedCatalogItem {
  id: string;
  key: string;
  name: string;
}

export interface PostgresSeedResult {
  tenantId: string;
  actorId: string;
  connectionId: string;
  credentialRef: string;
  datasets: SeedCatalogItem[];
  queryDefinitions: SeedCatalogItem[];
  dashboardDefinitions: SeedCatalogItem[];
  reportDefinitions: SeedCatalogItem[];
  semanticModels: SeedCatalogItem[];
}

// The JSONB cross-reference builders are typed for the Mongo path (ObjectId);
// on Postgres the reference is a UUID string carried verbatim into JSONB / FK
// columns. This adapter keeps the shared builders reusable without duplicating
// the (large) demo shapes.
function asRef(uuid: string): Types.ObjectId {
  return uuid as unknown as Types.ObjectId;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export async function seedPostgresFoundation(
  db: Kysely<DB>,
  protectedCredential: ProtectedCredentialValue,
): Promise<PostgresSeedResult> {
  const tenantId = await upsertTenant(db);
  const actorId = await upsertOwnerUser(db, tenantId);
  const connectionId = await upsertConnection(db, tenantId);
  const credentialId = await upsertCredential(db, tenantId, connectionId, protectedCredential);
  const credentialRef = `cred_${credentialId}`;
  await attachCredentialRef(db, tenantId, connectionId, credentialRef);

  const datasets = await upsertDatasets(db, tenantId, connectionId);
  await upsertFieldMappings(db, tenantId, connectionId);
  const queries = await upsertQueryDefinitions(db, tenantId, datasets);
  const dashboards = await upsertDashboardDefinitions(db, tenantId, queries);
  const reports = await upsertReportDefinitions(db, tenantId, queries, dashboards);
  const semanticModels = await upsertSemanticModels(db, tenantId);

  return {
    tenantId,
    actorId,
    connectionId,
    credentialRef,
    datasets: datasets.map((d) => ({ id: d.id, key: d.key, name: d.name })),
    queryDefinitions: queries.map((q) => ({ id: q.id, key: q.key, name: q.name })),
    dashboardDefinitions: dashboards,
    reportDefinitions: reports,
    semanticModels,
  };
}

async function upsertTenant(db: Kysely<DB>): Promise<string> {
  const row = await db
    .insertInto('tenants')
    .values({
      name: 'Delfos Demo Local',
      slug: demoSeedKeys.tenantSlug,
      status: 'active',
      settings: json({
        environment: 'local',
        demo: true,
        dataPolicy: 'fictional-configuration-only',
      }),
    })
    .onConflict((oc) =>
      oc.column('slug').doUpdateSet({
        name: 'Delfos Demo Local',
        status: 'active',
        settings: json({
          environment: 'local',
          demo: true,
          dataPolicy: 'fictional-configuration-only',
        }),
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow();

  return row.id;
}

async function upsertOwnerUser(db: Kysely<DB>, tenantId: string): Promise<string> {
  const row = await db
    .insertInto('users')
    .values({
      tenant_id: tenantId,
      name: 'Owner Demo',
      email: demoSeedKeys.ownerEmail,
      role: 'owner',
      status: 'active',
    })
    .onConflict((oc) =>
      oc.columns(['tenant_id', 'email']).doUpdateSet({
        name: 'Owner Demo',
        role: 'owner',
        status: 'active',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow();

  return row.id;
}

async function upsertConnection(db: Kysely<DB>, tenantId: string): Promise<string> {
  const row = await db
    .insertInto('connections')
    .values({
      tenant_id: tenantId,
      name: demoSeedKeys.connectionName,
      type: 'customer_api',
      base_url: 'https://demo-api.invalid',
      auth_type: 'bearer_token',
      allowed_headers: json(['x-demo-tenant']),
      metadata: json({
        environment: 'local',
        provider: 'demo',
        note: 'fictional-source-no-external-call',
      }),
      status: 'active',
    })
    .onConflict((oc) =>
      oc.columns(['tenant_id', 'name']).doUpdateSet({
        type: 'customer_api',
        base_url: 'https://demo-api.invalid',
        auth_type: 'bearer_token',
        allowed_headers: json(['x-demo-tenant']),
        metadata: json({
          environment: 'local',
          provider: 'demo',
          note: 'fictional-source-no-external-call',
        }),
        status: 'active',
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow();

  return row.id;
}

async function upsertCredential(
  db: Kysely<DB>,
  tenantId: string,
  connectionId: string,
  protectedCredential: ProtectedCredentialValue,
): Promise<string> {
  // credentials has no business-key unique constraint, so upsert manually by
  // (tenant_id, connection_id, name).
  const existing = await db
    .selectFrom('credentials')
    .select('id')
    .where('tenant_id', '=', tenantId)
    .where('connection_id', '=', connectionId)
    .where('name', '=', demoSeedKeys.credentialName)
    .executeTakeFirst();

  if (existing) {
    await db
      .updateTable('credentials')
      .set({
        type: 'bearer_token',
        provider: 'demo-local',
        status: 'active',
        masked_preview: protectedCredential.maskedPreview,
        protected_secret_value: protectedCredential.protectedValue,
        protection_provider: protectedCredential.provider,
        updated_by: demoActorId,
      })
      .where('id', '=', existing.id)
      .execute();

    return existing.id;
  }

  const row = await db
    .insertInto('credentials')
    .values({
      tenant_id: tenantId,
      connection_id: connectionId,
      type: 'bearer_token',
      provider: 'demo-local',
      name: demoSeedKeys.credentialName,
      status: 'active',
      masked_preview: protectedCredential.maskedPreview,
      protected_secret_value: protectedCredential.protectedValue,
      protection_provider: protectedCredential.provider,
      created_by: demoActorId,
      updated_by: demoActorId,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return row.id;
}

async function attachCredentialRef(
  db: Kysely<DB>,
  tenantId: string,
  connectionId: string,
  credentialRef: string,
): Promise<void> {
  await db
    .updateTable('connections')
    .set({ credential_ref: credentialRef })
    .where('id', '=', connectionId)
    .where('tenant_id', '=', tenantId)
    .execute();
}

async function upsertDatasets(
  db: Kysely<DB>,
  tenantId: string,
  connectionId: string,
): Promise<SeedCatalogItem[]> {
  const items: SeedCatalogItem[] = [];

  for (const input of buildDatasetInputs()) {
    const shared = {
      connection_id: connectionId,
      name: input.name,
      description: input.description,
      source_type: 'api',
      status: 'active',
      refresh_mode: 'manual',
      schema_mode: 'declared',
      fields: json(input.fields),
      primary_key_fields: json(input.primaryKeyFields),
      time_field: input.timeField ?? null,
      tags: json(input.tags),
      metadata: json(input.metadata),
      settings: json({ defaultPageSize: 25, devSeed: true }),
      updated_by: demoActorId,
    };

    const row = await db
      .insertInto('datasets')
      .values({
        tenant_id: tenantId,
        dataset_key: input.datasetKey,
        created_by: demoActorId,
        ...shared,
      })
      .onConflict((oc) => oc.columns(['tenant_id', 'dataset_key']).doUpdateSet(shared))
      .returning('id')
      .executeTakeFirstOrThrow();

    items.push({ id: row.id, key: input.datasetKey, name: input.name });
  }

  return items;
}

async function upsertFieldMappings(
  db: Kysely<DB>,
  tenantId: string,
  connectionId: string,
): Promise<void> {
  for (const input of buildFieldMappingInputs()) {
    const shared = {
      connection_id: connectionId,
      source_path: input.sourcePath,
      target_type: input.targetType,
      required: input.required,
      transform: input.transform ?? null,
      status: 'active',
    };

    await db
      .insertInto('field_mappings')
      .values({
        tenant_id: tenantId,
        dataset_key: input.datasetKey,
        target_field: input.targetField,
        ...shared,
      })
      .onConflict((oc) =>
        oc.columns(['tenant_id', 'dataset_key', 'target_field']).doUpdateSet(shared),
      )
      .execute();
  }
}

async function upsertQueryDefinitions(
  db: Kysely<DB>,
  tenantId: string,
  datasets: SeedCatalogItem[],
): Promise<SeedCatalogItem[]> {
  const datasetIdByKey = new Map(datasets.map((d) => [d.key, d.id]));
  const items: SeedCatalogItem[] = [];

  for (const input of buildQueryInputs()) {
    const datasetId = datasetIdByKey.get(input.datasetKey);
    if (!datasetId) {
      throw new Error(`Dataset ${input.datasetKey} is required for query seed.`);
    }

    const shared = {
      dataset_id: datasetId,
      name: input.name,
      description: input.description,
      type: input.type,
      status: 'active',
      metrics: json(input.metrics),
      dimensions: json(input.dimensions),
      filters: json([buildQueryFilter(input.timeField)]),
      sorts: json(buildQuerySorts(input.timeField)),
      time_field: input.timeField ?? null,
      default_limit: 100,
      allowed_granularities: json(demoAllowedGranularities),
      tags: json(input.tags),
      metadata: json({ domain: 'demo', devSeed: true }),
      settings: json({ visibleInBuilder: true }),
      updated_by: demoActorId,
    };

    const row = await db
      .insertInto('query_definitions')
      .values({
        tenant_id: tenantId,
        query_key: input.queryKey,
        created_by: demoActorId,
        ...shared,
      })
      .onConflict((oc) => oc.columns(['tenant_id', 'query_key']).doUpdateSet(shared))
      .returning('id')
      .executeTakeFirstOrThrow();

    items.push({ id: row.id, key: input.queryKey, name: input.name });
  }

  return items;
}

function requireItem(items: SeedCatalogItem[], key: string): SeedCatalogItem {
  const item = items.find((i) => i.key === key);
  if (!item) {
    throw new Error(`Seed item ${key} is required.`);
  }
  return item;
}

async function upsertDashboardDefinitions(
  db: Kysely<DB>,
  tenantId: string,
  queries: SeedCatalogItem[],
): Promise<SeedCatalogItem[]> {
  const input = buildDashboardInput({
    salesOverview: asRef(requireItem(queries, 'sales_overview_demo').id),
    salesByDay: asRef(requireItem(queries, 'sales_by_day_demo').id),
    customersSummary: asRef(requireItem(queries, 'customers_summary_demo').id),
  });

  const shared = {
    name: input.name,
    description: input.description,
    status: 'active',
    visibility: 'tenant',
    layout: json(input.layout),
    sections: json(input.sections),
    widgets: json(input.widgets),
    filters: json(input.filters),
    tags: json(input.tags),
    metadata: json(input.metadata),
    settings: json(input.settings),
    updated_by: demoActorId,
  };

  const row = await db
    .insertInto('dashboard_definitions')
    .values({
      tenant_id: tenantId,
      dashboard_key: input.dashboardKey,
      created_by: demoActorId,
      ...shared,
    })
    .onConflict((oc) => oc.columns(['tenant_id', 'dashboard_key']).doUpdateSet(shared))
    .returning('id')
    .executeTakeFirstOrThrow();

  return [{ id: row.id, key: input.dashboardKey, name: input.name }];
}

async function upsertReportDefinitions(
  db: Kysely<DB>,
  tenantId: string,
  queries: SeedCatalogItem[],
  dashboards: SeedCatalogItem[],
): Promise<SeedCatalogItem[]> {
  const input = buildReportInput({
    salesOverview: asRef(requireItem(queries, 'sales_overview_demo').id),
    commercialDashboard: asRef(requireItem(dashboards, 'commercial_dashboard_demo').id),
  });

  const shared = {
    name: input.name,
    description: input.description,
    query_definition_id: requireItem(queries, 'sales_overview_demo').id,
    dashboard_definition_id: requireItem(dashboards, 'commercial_dashboard_demo').id,
    status: 'active',
    visibility: 'tenant',
    layout: json(input.layout),
    sections: json(input.sections),
    blocks: json(input.blocks),
    filters: json(input.filters),
    parameters: json(input.parameters),
    export_options: json(input.exportOptions),
    tags: json(input.tags),
    metadata: json(input.metadata),
    settings: json(input.settings),
    updated_by: demoActorId,
  };

  const row = await db
    .insertInto('report_definitions')
    .values({
      tenant_id: tenantId,
      report_key: input.reportKey,
      created_by: demoActorId,
      ...shared,
    })
    .onConflict((oc) => oc.columns(['tenant_id', 'report_key']).doUpdateSet(shared))
    .returning('id')
    .executeTakeFirstOrThrow();

  return [{ id: row.id, key: input.reportKey, name: input.name }];
}

async function upsertSemanticModels(db: Kysely<DB>, tenantId: string): Promise<SeedCatalogItem[]> {
  const items: SeedCatalogItem[] = [];

  for (const input of buildSemanticModelInputs()) {
    const shared = {
      name: input.name,
      description: input.description,
      status: input.status,
      dataset_keys: json(input.datasetKeys),
      measures: json(input.measures),
      dimensions: json(input.dimensions),
      glossary_terms: json(input.glossaryTerms),
      quality: json(input.quality),
      tags: json(input.tags),
      metadata: json({ domain: 'demo', devSeed: true }),
      settings: json({ visibleInBuilder: true, devSeed: true }),
      updated_by: demoActorId,
    };

    const row = await db
      .insertInto('semantic_models')
      .values({
        tenant_id: tenantId,
        model_key: input.modelKey,
        created_by: demoActorId,
        ...shared,
      })
      .onConflict((oc) => oc.columns(['tenant_id', 'model_key']).doUpdateSet(shared))
      .returning('id')
      .executeTakeFirstOrThrow();

    items.push({ id: row.id, key: input.modelKey, name: input.name });
  }

  return items;
}
