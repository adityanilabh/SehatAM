/**
 * Database upgrades.
 *
 * The schema version lives in SQLite's own `PRAGMA user_version`. Each migration
 * moves the database up by exactly one version and runs in a transaction together
 * with the version bump, so a failed upgrade leaves the database as it was.
 *
 * Rules for writing migrations:
 * - Never edit or remove a migration that has shipped; add a new one.
 * - Never drop or rewrite a table in the same migration that replaces it. Copy the
 *   data first, and remove the old table in a later release.
 */

/** The part of the expo-sqlite database API the runner needs. */
export type MigrationDb = {
  getFirstAsync<T>(source: string): Promise<T | null>;
  execAsync(source: string): Promise<void>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};

export type Migration = {
  /** The version the database is at once this migration has run. Starts at 1. */
  version: number;
  up: (db: MigrationDb) => Promise<void>;
};

export type MigrationResult = {
  from: number;
  to: number;
};

export async function getSchemaVersion(db: MigrationDb): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function migrate(db: MigrationDb, migrations: Migration[]): Promise<MigrationResult> {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migrations must be numbered 1, 2, 3 in order; found version ${migration.version} at position ${index + 1}.`
      );
    }
  });

  const from = await getSchemaVersion(db);
  const latest = migrations.length;

  if (from > latest) {
    // The data was written by a newer build of the app. Refuse rather than guess.
    throw new Error(
      `Database is at version ${from}, but this build only knows up to version ${latest}.`
    );
  }

  for (const migration of migrations.slice(from)) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }

  return { from, to: latest };
}
