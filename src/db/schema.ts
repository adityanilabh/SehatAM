import { type Migration } from './migrate';

/**
 * Every row has a device-generated id plus created/updated/deleted timestamps so
 * cloud sync can be added later without changing these tables. Deleting a row sets
 * `deleted_at`; rows are only removed for good by "Delete all data".
 */
export const migrations: Migration[] = [
  {
    version: 1,
    up: (db) =>
      db.execAsync(`
        CREATE TABLE food_entry (
          id TEXT PRIMARY KEY NOT NULL,
          log_date TEXT NOT NULL,
          eaten_at TEXT,
          food_text TEXT NOT NULL,
          quantity TEXT,
          calories REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );
        CREATE INDEX food_entry_log_date ON food_entry (log_date);

        CREATE TABLE weight_entry (
          id TEXT PRIMARY KEY NOT NULL,
          log_date TEXT NOT NULL,
          weight_kg REAL NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );
        CREATE INDEX weight_entry_log_date ON weight_entry (log_date);

        CREATE TABLE setting (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `),
  },
];
