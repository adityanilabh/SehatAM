import { type AppDb } from './database';
import { getSettings, normaliseSettings, updateSettings, type Settings } from './settings';
import { isValidWeight } from './weight';

import { isLogDate } from '@/lib/day';

/**
 * Export and import. A backup is a plain JSON file holding every live entry and the
 * settings. Importing merges by id and keeps whichever copy was edited most recently,
 * so importing the same file twice, or an old file over newer data, loses nothing.
 */

export const BACKUP_APP = 'SehatAM';
export const BACKUP_FORMAT_VERSION = 1;

type FoodBackupRow = {
  id: string;
  log_date: string;
  eaten_at: string | null;
  food_text: string;
  quantity: string | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
};

type WeightBackupRow = {
  id: string;
  log_date: string;
  weight_kg: number;
  created_at: string;
  updated_at: string;
};

export type Backup = {
  app: typeof BACKUP_APP;
  formatVersion: number;
  exportedAt: string;
  food: FoodBackupRow[];
  weight: WeightBackupRow[];
  settings: Settings;
};

export type ImportResult = {
  food: number;
  weight: number;
};

export async function exportData(db: AppDb, now = new Date()): Promise<Backup> {
  const food = await db.getAllAsync<FoodBackupRow>(
    `SELECT id, log_date, eaten_at, food_text, quantity, calories, created_at, updated_at
     FROM food_entry WHERE deleted_at IS NULL ORDER BY log_date, created_at`,
    []
  );
  const weight = await db.getAllAsync<WeightBackupRow>(
    `SELECT id, log_date, weight_kg, created_at, updated_at
     FROM weight_entry WHERE deleted_at IS NULL ORDER BY log_date`,
    []
  );

  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    food,
    weight,
    settings: await getSettings(db),
  };
}

const isText = (value: unknown): value is string => typeof value === 'string' && value !== '';
const isTextOrNull = (value: unknown) => value === null || typeof value === 'string';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isFoodRow(row: unknown): row is FoodBackupRow {
  return (
    isRecord(row) &&
    isText(row.id) &&
    isLogDate(row.log_date) &&
    isTextOrNull(row.eaten_at) &&
    isText(row.food_text) &&
    isTextOrNull(row.quantity) &&
    (row.calories === null || typeof row.calories === 'number') &&
    isText(row.created_at) &&
    isText(row.updated_at)
  );
}

function isWeightRow(row: unknown): row is WeightBackupRow {
  return (
    isRecord(row) &&
    isText(row.id) &&
    isLogDate(row.log_date) &&
    typeof row.weight_kg === 'number' &&
    isValidWeight(row.weight_kg) &&
    isText(row.created_at) &&
    isText(row.updated_at)
  );
}

/** Reads a backup file's text. Throws a message fit to show the user if it is not usable. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a SehatAM backup.');
  }
  if (!isRecord(data) || data.app !== BACKUP_APP || typeof data.formatVersion !== 'number') {
    throw new Error('This file is not a SehatAM backup.');
  }
  if (data.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error('This backup was made by a newer version of the app. Update the app first.');
  }
  if (!Array.isArray(data.food) || !Array.isArray(data.weight)) {
    throw new Error('This backup file is damaged.');
  }
  if (!data.food.every(isFoodRow) || !data.weight.every(isWeightRow)) {
    throw new Error('This backup file is damaged.');
  }

  return {
    app: BACKUP_APP,
    formatVersion: data.formatVersion,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    food: data.food,
    weight: data.weight,
    settings: normaliseSettings(isRecord(data.settings) ? data.settings : {}),
  };
}

export async function importData(
  db: AppDb,
  backup: Backup,
  now = new Date()
): Promise<ImportResult> {
  const stamp = now.toISOString();

  await db.withTransactionAsync(async () => {
    // The WHERE on the upsert keeps the local row when it was edited (or deleted)
    // more recently than the copy in the file.
    for (const row of backup.food) {
      await db.runAsync(
        `INSERT INTO food_entry
           (id, log_date, eaten_at, food_text, quantity, calories, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT (id) DO UPDATE SET
           log_date = excluded.log_date,
           eaten_at = excluded.eaten_at,
           food_text = excluded.food_text,
           quantity = excluded.quantity,
           calories = excluded.calories,
           updated_at = excluded.updated_at,
           deleted_at = NULL
         WHERE excluded.updated_at >= food_entry.updated_at`,
        [
          row.id,
          row.log_date,
          row.eaten_at,
          row.food_text,
          row.quantity,
          row.calories,
          row.created_at,
          row.updated_at,
        ]
      );
    }

    for (const row of backup.weight) {
      await db.runAsync(
        `INSERT INTO weight_entry (id, log_date, weight_kg, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, NULL)
         ON CONFLICT (id) DO UPDATE SET
           log_date = excluded.log_date,
           weight_kg = excluded.weight_kg,
           updated_at = excluded.updated_at,
           deleted_at = NULL
         WHERE excluded.updated_at >= weight_entry.updated_at`,
        [row.id, row.log_date, row.weight_kg, row.created_at, row.updated_at]
      );
    }

    // A day holds one weight. If the file and the phone each have one for the same
    // day under different ids, keep the one edited most recently.
    await db.runAsync(
      `UPDATE weight_entry SET deleted_at = ?
       WHERE deleted_at IS NULL AND id NOT IN (
         SELECT id FROM (
           SELECT id, ROW_NUMBER() OVER (
             PARTITION BY log_date ORDER BY updated_at DESC, id
           ) AS position
           FROM weight_entry WHERE deleted_at IS NULL
         ) WHERE position = 1
       )`,
      [stamp]
    );
  });

  await updateSettings(db, backup.settings, now);

  return { food: backup.food.length, weight: backup.weight.length };
}

/** Removes everything for good, including rows that were only marked deleted. */
export async function deleteAllData(db: AppDb): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM food_entry; DELETE FROM weight_entry; DELETE FROM setting;');
  });
}
