// Node's built-in SQLite, so tests run real SQL without the phone's native module.
import { DatabaseSync } from 'node:sqlite';

import { prepareDb, type AppDb, type SqlParams } from '../database';

export type TestDb = AppDb & {
  all<T>(source: string): T[];
  close(): void;
};

/** Opens a database with the same async surface the app uses. */
export function openTestDb(path = ':memory:'): TestDb {
  const db = new DatabaseSync(path);

  return {
    async getFirstAsync<T>(source: string, params: SqlParams = []) {
      return (db.prepare(source).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(source: string, params: SqlParams) {
      return db.prepare(source).all(...params) as T[];
    },
    async runAsync(source: string, params: SqlParams) {
      return db.prepare(source).run(...params);
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

/** An in-memory database already at the app's current schema. */
export async function openAppTestDb(): Promise<TestDb> {
  const db = openTestDb();
  await prepareDb(db);
  return db;
}
