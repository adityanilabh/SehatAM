import { migrate, type MigrationDb } from './migrate';
import { migrations } from './schema';

export type SqlParams = (string | number | null)[];

/**
 * The part of the expo-sqlite database the app uses. Everything goes through this
 * type so the functions in this folder can be tested against Node's SQLite, and so
 * the web implementation can be replaced without touching a screen.
 */
export type AppDb = MigrationDb & {
  runAsync(source: string, params: SqlParams): Promise<unknown>;
  getAllAsync<T>(source: string, params: SqlParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
};

export const DATABASE_NAME = 'sehatam.db';

/** Brings a database to the current schema. Safe to call on every app start. */
export async function prepareDb(db: AppDb): Promise<void> {
  await migrate(db, migrations);
}
