// Node's built-in SQLite, so tests run real SQL without the phone's native module.
import { DatabaseSync } from 'node:sqlite';

import { type MigrationDb } from '../migrate';

export type TestDb = MigrationDb & {
  all<T>(source: string): T[];
  close(): void;
};

/** Opens a database with the same async surface the migration runner uses in the app. */
export function openTestDb(path = ':memory:'): TestDb {
  const db = new DatabaseSync(path);

  return {
    async getFirstAsync<T>(source: string) {
      return (db.prepare(source).get() as T | undefined) ?? null;
    },
    async execAsync(source: string) {
      db.exec(source);
    },
    async withTransactionAsync(task: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    all<T>(source: string) {
      return db.prepare(source).all() as T[];
    },
    close() {
      db.close();
    },
  };
}
