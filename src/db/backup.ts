import { type AppDb } from './database';
import { getSettings, normaliseSettings, updateSettings, type Settings } from './settings';
import { isValidWeight } from './weight';

import { isLogDate } from '@/lib/day';
import { isMeal } from '@/lib/meals';

/**
 * Export and import. A backup is a plain JSON file holding every live entry and the
 * settings. Importing merges by id and keeps whichever copy was edited most recently,
 * so importing the same file twice, or an old file over newer data, loses nothing.
 */

export const BACKUP_APP = 'SehatAM';
/**
 * Version 2 added `meal` to food rows. Version 3 added `calorie_source` and the
 * food memory. Older files are still accepted.
 */
export const BACKUP_FORMAT_VERSION = 3;

type FoodBackupRow = {
  id: string;
  log_date: string;
  /** Absent in version 1 files. */
  meal?: string | null;
  eaten_at: string | null;
  food_text: string;
  quantity: string | null;
  calories: number | null;
  /** Absent before version 3. */
  calorie_source?: string | null;
  created_at: string;
  updated_at: string;
};

/** A calorie figure the app has learned; see `memory.ts`. */
type MemoryBackupRow = {
  key: string;
  per: string;
  kcal: number;
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
  memory: MemoryBackupRow[];
  settings: Settings;
};

export type ImportResult = {
  food: number;
  weight: number;
};

export async function exportData(db: AppDb, now = new Date()): Promise<Backup> {
  const food = await db.getAllAsync<FoodBackupRow>(
    `SELECT id, log_date, meal, eaten_at, food_text, quantity, calories, calorie_source,
            created_at, updated_at
     FROM food_entry WHERE deleted_at IS NULL ORDER BY log_date, created_at`,
    []
  );
  const memory = await db.getAllAsync<MemoryBackupRow>(
    'SELECT key, per, kcal, updated_at FROM food_memory ORDER BY key, per',
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
    memory,
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
    (row.meal === undefined || isTextOrNull(row.meal)) &&
    isTextOrNull(row.eaten_at) &&
    isText(row.food_text) &&
    isTextOrNull(row.quantity) &&
    (row.calories === null || typeof row.calories === 'number') &&
    isText(row.created_at) &&
    isText(row.updated_at)
  );
}

function isMemoryRow(row: unknown): row is MemoryBackupRow {
  return (
    isRecord(row) &&
    isText(row.key) &&
    (row.per === 'item' || row.per === 'unit') &&
    typeof row.kcal === 'number' &&
    Number.isFinite(row.kcal) &&
    row.kcal >= 0 &&
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
    // Losing a learned figure is harmless, so unreadable memory rows are skipped.
    memory: Array.isArray(data.memory) ? data.memory.filter(isMemoryRow) : [],
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
           (id, log_date, meal, eaten_at, food_text, quantity, calories, calorie_source,
            created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT (id) DO UPDATE SET
           log_date = excluded.log_date,
           meal = excluded.meal,
           eaten_at = excluded.eaten_at,
           food_text = excluded.food_text,
           quantity = excluded.quantity,
           calories = excluded.calories,
           calorie_source = excluded.calorie_source,
           updated_at = excluded.updated_at,
           deleted_at = NULL
         WHERE excluded.updated_at >= food_entry.updated_at`,
        [
          row.id,
          row.log_date,
          // An unknown meal name (from a newer app) is dropped rather than stored.
          isMeal(row.meal) ? row.meal : null,
          row.eaten_at,
          row.food_text,
          row.quantity,
          row.calories,
          row.calories === null ? null : (row.calorie_source ?? 'manual'),
          row.created_at,
          row.updated_at,
        ]
      );
    }

    for (const row of backup.memory) {
      await db.runAsync(
        `INSERT INTO food_memory (key, per, kcal, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (key, per) DO UPDATE SET
           kcal = excluded.kcal,
           updated_at = excluded.updated_at
         WHERE excluded.updated_at >= food_memory.updated_at`,
        [row.key, row.per, row.kcal, row.updated_at]
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
    await db.execAsync(
      'DELETE FROM food_entry; DELETE FROM weight_entry; DELETE FROM food_memory; DELETE FROM setting;'
    );
  });
}
