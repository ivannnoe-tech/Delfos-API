import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { FileMigrationProvider, Kysely, Migrator } from 'kysely';

/**
 * Build a Kysely {@link Migrator} bound to the P2 migrations directory
 * (ADR-0035 / ADR-0036).
 *
 * Uses a {@link FileMigrationProvider} reading the `migrations/` folder next to
 * this file, so the same provider works under `ts-node` (`.ts` sources) and the
 * compiled build (`.js`). Migrations run in lexicographic filename order
 * (`0001_…` … `0005_…`).
 */
export function createMigrator(db: Kysely<unknown>): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });
}
