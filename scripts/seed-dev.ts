import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AppModule } from '../src/app.module';
import {
  Connection,
  ConnectionAuthType,
  ConnectionDocument,
  ConnectionStatus,
  ConnectionType,
} from '../src/modules/connections/schemas/connection.schema';
import {
  Credential,
  CredentialDocument,
  CredentialStatus,
  CredentialType,
} from '../src/modules/credentials/schemas/credential.schema';
import { LocalCredentialProtectorService } from '../src/modules/credentials/services/local-credential-protector.service';
import {
  DashboardDefinition,
  DashboardDefinitionDocument,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../src/modules/dashboard-definitions/schemas/dashboard-definition.schema';
import {
  Dataset,
  DatasetDocument,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../src/modules/datasets/schemas/dataset.schema';
import {
  FieldMapping,
  FieldMappingDocument,
  FieldMappingStatus,
} from '../src/modules/field-mappings/schemas/field-mapping.schema';
import {
  QueryDefinition,
  QueryDefinitionDocument,
  QueryDefinitionStatus,
} from '../src/modules/query-definitions/schemas/query-definition.schema';
import { Tenant, TenantDocument, TenantStatus } from '../src/modules/tenants/schemas/tenant.schema';
import { User, UserDocument, UserRole, UserStatus } from '../src/modules/users/schemas/user.schema';
import {
  buildDashboardInput,
  buildDatasetInputs,
  buildDelfosWebCommand,
  buildFieldMappingInputs,
  buildQueryFilter,
  buildQueryInputs,
  buildQuerySorts,
  demoActorId,
  demoAllowedGranularities,
  demoCredentialPlaceholder,
  demoSeedKeys,
} from './seed-dev-data';

interface SeedModels {
  tenants: Model<TenantDocument>;
  users: Model<UserDocument>;
  connections: Model<ConnectionDocument>;
  credentials: Model<CredentialDocument>;
  datasets: Model<DatasetDocument>;
  fieldMappings: Model<FieldMappingDocument>;
  queryDefinitions: Model<QueryDefinitionDocument>;
  dashboardDefinitions: Model<DashboardDefinitionDocument>;
}

interface SeedResult {
  tenantId: string;
  actorId: string;
  connectionId: string;
  credentialRef: string;
  datasetKeys: string[];
  queryKeys: string[];
  dashboardKeys: string[];
  webCommand: string;
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const result = await seedDevFoundation(app);
    printSeedResult(result);
  } finally {
    await app.close();
  }
}

export async function seedDevFoundation(app: INestApplicationContext): Promise<SeedResult> {
  const models = getSeedModels(app);
  const credentialProtector = app.get(LocalCredentialProtectorService);
  const tenant = await upsertTenant(models.tenants);
  const user = await upsertOwnerUser(models.users, tenant._id);
  const connection = await upsertConnection(models.connections, tenant._id);
  const protectedCredential = credentialProtector.protect(demoCredentialPlaceholder);
  const credential = await upsertCredential(
    models.credentials,
    tenant._id,
    connection._id,
    protectedCredential,
  );
  const credentialRef = toCredentialRef(credential._id);
  const connectionWithCredential = await attachCredentialRef(
    models.connections,
    tenant._id,
    connection._id,
    credentialRef,
  );
  const datasets = await upsertDatasets(models.datasets, tenant._id, connectionWithCredential._id);

  await upsertFieldMappings(models.fieldMappings, tenant._id, connectionWithCredential._id);

  const queries = await upsertQueryDefinitions(models.queryDefinitions, tenant._id, datasets);
  const dashboards = await upsertDashboardDefinitions(
    models.dashboardDefinitions,
    tenant._id,
    queries,
  );

  return {
    tenantId: tenant._id.toString(),
    actorId: user._id.toString(),
    connectionId: connectionWithCredential._id.toString(),
    credentialRef,
    datasetKeys: datasets.map((dataset) => dataset.datasetKey),
    queryKeys: queries.map((query) => query.queryKey),
    dashboardKeys: dashboards.map((dashboard) => dashboard.dashboardKey),
    webCommand: buildDelfosWebCommand(tenant._id.toString(), user._id.toString()),
  };
}

function getSeedModels(app: INestApplicationContext): SeedModels {
  return {
    tenants: app.get<Model<TenantDocument>>(getModelToken(Tenant.name)),
    users: app.get<Model<UserDocument>>(getModelToken(User.name)),
    connections: app.get<Model<ConnectionDocument>>(getModelToken(Connection.name)),
    credentials: app.get<Model<CredentialDocument>>(getModelToken(Credential.name)),
    datasets: app.get<Model<DatasetDocument>>(getModelToken(Dataset.name)),
    fieldMappings: app.get<Model<FieldMappingDocument>>(getModelToken(FieldMapping.name)),
    queryDefinitions: app.get<Model<QueryDefinitionDocument>>(getModelToken(QueryDefinition.name)),
    dashboardDefinitions: app.get<Model<DashboardDefinitionDocument>>(
      getModelToken(DashboardDefinition.name),
    ),
  };
}

async function upsertTenant(model: Model<TenantDocument>): Promise<TenantDocument> {
  return model
    .findOneAndUpdate(
      { slug: demoSeedKeys.tenantSlug },
      {
        $set: {
          name: 'Delfos Demo Local',
          slug: demoSeedKeys.tenantSlug,
          status: TenantStatus.Active,
          settings: {
            environment: 'local',
            demo: true,
            dataPolicy: 'fictional-configuration-only',
          },
        },
      },
      upsertOptions(),
    )
    .exec();
}

async function upsertOwnerUser(
  model: Model<UserDocument>,
  tenantId: Types.ObjectId,
): Promise<UserDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, email: demoSeedKeys.ownerEmail },
      {
        $set: {
          tenantId,
          name: 'Owner Demo',
          email: demoSeedKeys.ownerEmail,
          role: UserRole.Owner,
          status: UserStatus.Active,
        },
      },
      upsertOptions(),
    )
    .exec();
}

async function upsertConnection(
  model: Model<ConnectionDocument>,
  tenantId: Types.ObjectId,
): Promise<ConnectionDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, name: demoSeedKeys.connectionName },
      {
        $set: {
          tenantId,
          name: demoSeedKeys.connectionName,
          type: ConnectionType.CustomerApi,
          baseUrl: 'https://demo-api.invalid',
          authType: ConnectionAuthType.BearerToken,
          allowedHeaders: ['x-demo-tenant'],
          metadata: {
            environment: 'local',
            provider: 'demo',
            note: 'fictional-source-no-external-call',
          },
          status: ConnectionStatus.Active,
        },
      },
      upsertOptions(),
    )
    .exec();
}

async function upsertCredential(
  model: Model<CredentialDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
  protectedCredential: {
    protectedValue: string;
    provider: string;
    maskedPreview: string | null;
  },
): Promise<CredentialDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, connectionId, name: demoSeedKeys.credentialName },
      {
        $set: {
          tenantId,
          connectionId,
          type: CredentialType.BearerToken,
          provider: 'demo-local',
          name: demoSeedKeys.credentialName,
          status: CredentialStatus.Active,
          maskedPreview: protectedCredential.maskedPreview,
          protectedSecretValue: protectedCredential.protectedValue,
          protectionProvider: protectedCredential.provider,
          updatedBy: demoActorId,
        },
        $setOnInsert: { createdBy: demoActorId },
      },
      upsertOptions(),
    )
    .exec();
}

async function attachCredentialRef(
  model: Model<ConnectionDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
  credentialRef: string,
): Promise<ConnectionDocument> {
  const connection = await model
    .findOneAndUpdate(
      { _id: connectionId, tenantId },
      { $set: { credentialRef } },
      { new: true, runValidators: true },
    )
    .exec();

  if (!connection) {
    throw new Error('Demo connection was not found after creation.');
  }

  return connection;
}

async function upsertDatasets(
  model: Model<DatasetDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
): Promise<DatasetDocument[]> {
  const datasets: DatasetDocument[] = [];

  for (const input of buildDatasetInputs()) {
    const dataset = await model
      .findOneAndUpdate(
        { tenantId, datasetKey: input.datasetKey },
        {
          $set: {
            ...input,
            tenantId,
            connectionId,
            sourceType: DatasetSourceType.Api,
            status: DatasetStatus.Active,
            refreshMode: DatasetRefreshMode.Manual,
            schemaMode: DatasetSchemaMode.Declared,
            settings: { defaultPageSize: 25, devSeed: true },
            updatedBy: demoActorId,
          },
          $setOnInsert: { createdBy: demoActorId },
        },
        upsertOptions(),
      )
      .exec();

    datasets.push(dataset);
  }

  return datasets;
}

async function upsertFieldMappings(
  model: Model<FieldMappingDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
): Promise<void> {
  for (const input of buildFieldMappingInputs()) {
    await model
      .findOneAndUpdate(
        { tenantId, datasetKey: input.datasetKey, targetField: input.targetField },
        { $set: { ...input, tenantId, connectionId, status: FieldMappingStatus.Active } },
        upsertOptions(),
      )
      .exec();
  }
}

async function upsertQueryDefinitions(
  model: Model<QueryDefinitionDocument>,
  tenantId: Types.ObjectId,
  datasets: DatasetDocument[],
): Promise<QueryDefinitionDocument[]> {
  const datasetsByKey = new Map(datasets.map((dataset) => [dataset.datasetKey, dataset]));
  const queries: QueryDefinitionDocument[] = [];

  for (const input of buildQueryInputs()) {
    const dataset = datasetsByKey.get(input.datasetKey);

    if (!dataset) {
      throw new Error(`Dataset ${input.datasetKey} is required for query seed.`);
    }

    const query = await model
      .findOneAndUpdate(
        { tenantId, queryKey: input.queryKey },
        {
          $set: {
            ...input,
            tenantId,
            datasetId: dataset._id,
            status: QueryDefinitionStatus.Active,
            filters: [buildQueryFilter(input.timeField)],
            sorts: buildQuerySorts(input.timeField),
            defaultLimit: 100,
            allowedGranularities: demoAllowedGranularities,
            metadata: { domain: 'demo', devSeed: true },
            settings: { visibleInBuilder: true },
            updatedBy: demoActorId,
          },
          $setOnInsert: { createdBy: demoActorId },
        },
        upsertOptions(),
      )
      .exec();

    queries.push(query);
  }

  return queries;
}

async function upsertDashboardDefinitions(
  model: Model<DashboardDefinitionDocument>,
  tenantId: Types.ObjectId,
  queries: QueryDefinitionDocument[],
): Promise<DashboardDefinitionDocument[]> {
  const input = buildDashboardInput({
    salesOverview: requireQuery(queries, 'sales_overview_demo')._id,
    salesByDay: requireQuery(queries, 'sales_by_day_demo')._id,
    customersSummary: requireQuery(queries, 'customers_summary_demo')._id,
  });

  const dashboard = await model
    .findOneAndUpdate(
      { tenantId, dashboardKey: input.dashboardKey },
      {
        $set: {
          ...input,
          tenantId,
          status: DashboardDefinitionStatus.Active,
          visibility: DashboardDefinitionVisibility.Tenant,
          updatedBy: demoActorId,
        },
        $setOnInsert: { createdBy: demoActorId },
      },
      upsertOptions(),
    )
    .exec();

  return [dashboard];
}

function requireQuery(
  queries: QueryDefinitionDocument[],
  queryKey: string,
): QueryDefinitionDocument {
  const query = queries.find((item) => item.queryKey === queryKey);

  if (!query) {
    throw new Error(`Query definition ${queryKey} is required for dashboard seed.`);
  }

  return query;
}

function upsertOptions(): {
  new: true;
  runValidators: true;
  setDefaultsOnInsert: true;
  upsert: true;
} {
  return { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true };
}

function toCredentialRef(id: Types.ObjectId): string {
  return `cred_${id.toString()}`;
}

function printSeedResult(result: SeedResult): void {
  console.log('Seed local concluido.');
  console.log(`tenantId criado/usado: ${result.tenantId}`);
  console.log(`actorId sugerido: ${result.actorId}`);
  console.log(`connectionId criado/usado: ${result.connectionId}`);
  console.log(`credentialRef criado/usado: ${result.credentialRef}`);
  console.log(`datasets: ${result.datasetKeys.join(', ')}`);
  console.log(`queryDefinitions: ${result.queryKeys.join(', ')}`);
  console.log(`dashboardDefinitions: ${result.dashboardKeys.join(', ')}`);
  console.log('');
  console.log('Comando sugerido no delfos-web (PowerShell):');
  console.log(result.webCommand);
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected seed error.';
    console.error(`Falha ao executar seed local: ${message}`);
    process.exitCode = 1;
  });
}
