import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from '../src/app.module';
import { ConnectionDocument } from '../src/modules/connections/schemas/connection.schema';
import { CredentialDocument } from '../src/modules/credentials/schemas/credential.schema';
import { LocalCredentialProtectorService } from '../src/modules/credentials/services/local-credential-protector.service';
import { DashboardDefinitionDocument } from '../src/modules/dashboard-definitions/schemas/dashboard-definition.schema';
import { DatasetDocument } from '../src/modules/datasets/schemas/dataset.schema';
import { FieldMappingDocument } from '../src/modules/field-mappings/schemas/field-mapping.schema';
import { QueryDefinitionDocument } from '../src/modules/query-definitions/schemas/query-definition.schema';
import { ReportDefinitionDocument } from '../src/modules/report-definitions/schemas/report-definition.schema';
import { SemanticModelDocument } from '../src/modules/semantic-models/schemas/semantic-model.schema';
import { TenantDocument } from '../src/modules/tenants/schemas/tenant.schema';
import { UserDocument } from '../src/modules/users/schemas/user.schema';
import {
  buildDelfosWebCommand,
  buildListDashboardDefinitionsCommand,
  buildListQueryDefinitionsCommand,
  buildPreviewDashboardDefinitionCommand,
  buildPreviewQueryDefinitionCommand,
  demoCredentialPlaceholder,
} from './seed-dev-data';
import {
  Connection,
  Credential,
  Dataset,
  DashboardDefinition,
  FieldMapping,
  QueryDefinition,
  ReportDefinition,
  SemanticModel,
  Tenant,
  User,
  attachCredentialRef,
  toCredentialRef,
  upsertConnection,
  upsertCredential,
  upsertDashboardDefinitions,
  upsertDatasets,
  upsertFieldMappings,
  upsertOwnerUser,
  upsertQueryDefinitions,
  upsertReportDefinitions,
  upsertSemanticModels,
  upsertTenant,
} from './seed-dev-upserts';

interface SeedModels {
  tenants: Model<TenantDocument>;
  users: Model<UserDocument>;
  connections: Model<ConnectionDocument>;
  credentials: Model<CredentialDocument>;
  datasets: Model<DatasetDocument>;
  fieldMappings: Model<FieldMappingDocument>;
  queryDefinitions: Model<QueryDefinitionDocument>;
  dashboardDefinitions: Model<DashboardDefinitionDocument>;
  reportDefinitions: Model<ReportDefinitionDocument>;
  semanticModels: Model<SemanticModelDocument>;
}

interface SeedCatalogItem {
  id: string;
  key: string;
  name: string;
}

interface SeedPreviewCommands {
  listQueryDefinitions: string;
  previewQueryDefinition: string;
  listDashboardDefinitions: string;
  previewDashboardDefinition: string;
}

interface SeedResult {
  tenantId: string;
  actorId: string;
  connectionId: string;
  credentialRef: string;
  datasets: SeedCatalogItem[];
  queryDefinitions: SeedCatalogItem[];
  dashboardDefinitions: SeedCatalogItem[];
  reportDefinitions: SeedCatalogItem[];
  semanticModels: SeedCatalogItem[];
  webCommand: string;
  previewCommands: SeedPreviewCommands;
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
  const reports = await upsertReportDefinitions(
    models.reportDefinitions,
    tenant._id,
    queries,
    dashboards,
  );
  const semanticModels = await upsertSemanticModels(models.semanticModels, tenant._id);

  const tenantId = tenant._id.toString();
  const actorId = user._id.toString();
  const queryItems = queries.map((query) => toCatalogItem(query._id, query.queryKey, query.name));
  const dashboardItems = dashboards.map((dashboard) =>
    toCatalogItem(dashboard._id, dashboard.dashboardKey, dashboard.name),
  );
  const reportItems = reports.map((report) =>
    toCatalogItem(report._id, report.reportKey, report.name),
  );
  const semanticModelItems = semanticModels.map((semanticModel) =>
    toCatalogItem(semanticModel._id, semanticModel.modelKey, semanticModel.name),
  );
  const previewQuery = requireCatalogItem(queryItems, 'sales_overview_demo');
  const previewDashboard = requireCatalogItem(dashboardItems, 'commercial_dashboard_demo');

  return {
    tenantId,
    actorId,
    connectionId: connectionWithCredential._id.toString(),
    credentialRef,
    datasets: datasets.map((dataset) =>
      toCatalogItem(dataset._id, dataset.datasetKey, dataset.name),
    ),
    queryDefinitions: queryItems,
    dashboardDefinitions: dashboardItems,
    reportDefinitions: reportItems,
    semanticModels: semanticModelItems,
    webCommand: buildDelfosWebCommand(tenantId, actorId),
    previewCommands: {
      listQueryDefinitions: buildListQueryDefinitionsCommand(tenantId, actorId),
      previewQueryDefinition: buildPreviewQueryDefinitionCommand({
        tenantId,
        actorId,
        queryDefinitionId: previewQuery.id,
        dashboardDefinitionId: previewDashboard.id,
      }),
      listDashboardDefinitions: buildListDashboardDefinitionsCommand(tenantId, actorId),
      previewDashboardDefinition: buildPreviewDashboardDefinitionCommand({
        tenantId,
        actorId,
        queryDefinitionId: previewQuery.id,
        dashboardDefinitionId: previewDashboard.id,
      }),
    },
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
    reportDefinitions: app.get<Model<ReportDefinitionDocument>>(
      getModelToken(ReportDefinition.name),
    ),
    semanticModels: app.get<Model<SemanticModelDocument>>(getModelToken(SemanticModel.name)),
  };
}

function toCatalogItem(id: { toString(): string }, key: string, name: string): SeedCatalogItem {
  return { id: id.toString(), key, name };
}

function requireCatalogItem(items: SeedCatalogItem[], key: string): SeedCatalogItem {
  const item = items.find((current) => current.key === key);

  if (!item) {
    throw new Error(`Catalog item ${key} is required for preview command seed output.`);
  }

  return item;
}

function printSeedResult(result: SeedResult): void {
  console.log('Seed local concluido.');
  console.log(`tenantId criado/usado: ${result.tenantId}`);
  console.log(`actorId sugerido: ${result.actorId}`);
  console.log(`connectionId criado/usado: ${result.connectionId}`);
  console.log(`credentialRef criado/usado: ${result.credentialRef}`);
  console.log('');
  printCatalog('Datasets:', result.datasets);
  console.log('');
  printCatalog('Query definitions:', result.queryDefinitions);
  console.log('');
  printCatalog('Dashboard definitions:', result.dashboardDefinitions);
  console.log('');
  printCatalog('Report definitions:', result.reportDefinitions);
  console.log('');
  printCatalog('Semantic models:', result.semanticModels);
  console.log('');
  console.log('Comando sugerido no delfos-web (PowerShell):');
  console.log(result.webCommand);
  console.log('');
  console.log('Comandos de teste de preview:');
  console.log('1. Listar query-definitions:');
  console.log(result.previewCommands.listQueryDefinitions);
  console.log('');
  console.log('2. Preview query-definition:');
  console.log(result.previewCommands.previewQueryDefinition);
  console.log('');
  console.log('3. Listar dashboard-definitions:');
  console.log(result.previewCommands.listDashboardDefinitions);
  console.log('');
  console.log('4. Preview dashboard-definition:');
  console.log(result.previewCommands.previewDashboardDefinition);
}

function printCatalog(title: string, items: SeedCatalogItem[]): void {
  console.log(title);

  for (const item of items) {
    console.log(`- ${item.key} | ${item.id} | ${item.name}`);
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected seed error.';
    console.error(`Falha ao executar seed local: ${message}`);
    process.exitCode = 1;
  });
}
