import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Kysely } from 'kysely';

import { AppModule } from '../src/app.module';
import { DB } from '../src/database/postgres/database.types';
import { KYSELY_DB } from '../src/database/postgres/postgres.constants';
import { LocalCredentialProtectorService } from '../src/modules/credentials/services/local-credential-protector.service';
import {
  buildDelfosWebCommand,
  buildListDashboardDefinitionsCommand,
  buildListQueryDefinitionsCommand,
  buildPreviewDashboardDefinitionCommand,
  buildPreviewQueryDefinitionCommand,
  demoCredentialPlaceholder,
} from './seed-dev-data';
import { seedPostgresFoundation } from './seed-dev-postgres';

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
    // PostgreSQL is the sole backend since P5 (ADR-0035); the Kysely instance is
    // always present once `DELFOS_POSTGRES_URL` is configured.
    const kysely = app.get<Kysely<DB> | null>(KYSELY_DB, { strict: false });

    if (!kysely) {
      throw new Error('PostgreSQL is required to seed (DELFOS_POSTGRES_URL not configured).');
    }

    const result = await seedDevFoundationPostgres(app, kysely);

    printSeedResult(result);
  } finally {
    await app.close();
  }
}

async function seedDevFoundationPostgres(
  app: INestApplicationContext,
  kysely: Kysely<DB>,
): Promise<SeedResult> {
  const credentialProtector = app.get(LocalCredentialProtectorService);
  const protectedCredential = credentialProtector.protect(demoCredentialPlaceholder);
  const seeded = await seedPostgresFoundation(kysely, protectedCredential);

  const previewQuery = requireCatalogItem(seeded.queryDefinitions, 'sales_overview_demo');
  const previewDashboard = requireCatalogItem(
    seeded.dashboardDefinitions,
    'commercial_dashboard_demo',
  );

  return {
    tenantId: seeded.tenantId,
    actorId: seeded.actorId,
    connectionId: seeded.connectionId,
    credentialRef: seeded.credentialRef,
    datasets: seeded.datasets,
    queryDefinitions: seeded.queryDefinitions,
    dashboardDefinitions: seeded.dashboardDefinitions,
    reportDefinitions: seeded.reportDefinitions,
    semanticModels: seeded.semanticModels,
    webCommand: buildDelfosWebCommand(seeded.tenantId, seeded.actorId),
    previewCommands: {
      listQueryDefinitions: buildListQueryDefinitionsCommand(seeded.tenantId, seeded.actorId),
      previewQueryDefinition: buildPreviewQueryDefinitionCommand({
        tenantId: seeded.tenantId,
        actorId: seeded.actorId,
        queryDefinitionId: previewQuery.id,
        dashboardDefinitionId: previewDashboard.id,
      }),
      listDashboardDefinitions: buildListDashboardDefinitionsCommand(
        seeded.tenantId,
        seeded.actorId,
      ),
      previewDashboardDefinition: buildPreviewDashboardDefinitionCommand({
        tenantId: seeded.tenantId,
        actorId: seeded.actorId,
        queryDefinitionId: previewQuery.id,
        dashboardDefinitionId: previewDashboard.id,
      }),
    },
  };
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
