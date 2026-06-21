import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { createMigrator } from '../src/database/postgres/migrator';

type Command = 'latest' | 'down' | 'status';

const USAGE = 'Usage: migrate <latest|down|status>';

function parseCommand(argv: string[]): Command {
  const command = argv[2];

  if (command === 'latest' || command === 'down' || command === 'status') {
    return command;
  }

  throw new Error(`Unknown or missing command: ${command ?? '<none>'}. ${USAGE}`);
}

function buildKysely(url: string): Kysely<unknown> {
  return new Kysely<unknown>({
    dialect: new PostgresDialect({ pool: new Pool({ connectionString: url, max: 5 }) }),
  });
}

async function run(): Promise<void> {
  const command = parseCommand(process.argv);
  const url = process.env.DELFOS_POSTGRES_URL;

  if (!url) {
    throw new Error('DELFOS_POSTGRES_URL is not set; cannot run migrations.');
  }

  const db = buildKysely(url);
  const migrator = createMigrator(db);

  try {
    if (command === 'status') {
      const migrations = await migrator.getMigrations();

      for (const migration of migrations) {
        const state = migration.executedAt ? 'executed' : 'pending';
        console.log(`${migration.name}: ${state}`);
      }

      return;
    }

    const { error, results } =
      command === 'latest' ? await migrator.migrateToLatest() : await migrator.migrateDown();

    for (const result of results ?? []) {
      if (result.status === 'Success') {
        console.log(`migration "${result.migrationName}" (${result.direction}) executed`);
      } else if (result.status === 'Error') {
        console.error(`migration "${result.migrationName}" (${result.direction}) failed`);
      }
    }

    if (error) {
      throw error instanceof Error ? error : new Error(JSON.stringify(error));
    }
  } finally {
    await db.destroy();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration command failed: ${message}`);
  process.exitCode = 1;
});
