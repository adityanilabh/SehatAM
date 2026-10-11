import { type AppDb } from './database';

import { type LogDate } from '@/lib/day';
import { newId } from '@/lib/id';

export type WeightEntry = {
  id: string;
  logDate: LogDate;
  weightKg: number;
  createdAt: string;
  updatedAt: string;
};

type WeightRow = {
  id: string;
  log_date: string;
  weight_kg: number;
  created_at: string;
  updated_at: string;
};

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

const COLUMNS = 'id, log_date, weight_kg, created_at, updated_at';

function toEntry(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    logDate: row.log_date,
    weightKg: row.weight_kg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isValidWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg >= MIN_WEIGHT_KG && weightKg <= MAX_WEIGHT_KG;
}

/** Records the weight for a day. A day holds one weight, so logging again replaces it. */
export async function logWeight(
  db: AppDb,
  input: { logDate: LogDate; weightKg: number },
  now = new Date()
): Promise<void> {
  if (!isValidWeight(input.weightKg)) {
    throw new Error(`Weight must be between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg.`);
  }
  // Two decimal places, so a weight typed in pounds converts back to the same figure.
  const weightKg = Math.round(input.weightKg * 100) / 100;
  const stamp = now.toISOString();

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM weight_entry WHERE log_date = ? AND deleted_at IS NULL',
      [input.logDate]
    );
    if (existing) {
      await db.runAsync('UPDATE weight_entry SET weight_kg = ?, updated_at = ? WHERE id = ?', [
        weightKg,
        stamp,
        existing.id,
      ]);
    } else {
      await db.runAsync(
        `INSERT INTO weight_entry (id, log_date, weight_kg, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [newId(), input.logDate, weightKg, stamp, stamp]
      );
    }
  });
}

export async function deleteWeight(db: AppDb, id: string, now = new Date()): Promise<void> {
  const stamp = now.toISOString();
  await db.runAsync(
    'UPDATE weight_entry SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    [stamp, stamp, id]
  );
}

/** Weights between two dates, inclusive, oldest first. */
export async function getWeights(db: AppDb, from: LogDate, to: LogDate): Promise<WeightEntry[]> {
  const rows = await db.getAllAsync<WeightRow>(
    `SELECT ${COLUMNS} FROM weight_entry
     WHERE log_date BETWEEN ? AND ? AND deleted_at IS NULL
     ORDER BY log_date`,
    [from, to]
  );
  return rows.map(toEntry);
}

/** The most recent weights up to a date, newest first. */
export async function getRecentWeights(
  db: AppDb,
  upTo: LogDate,
  limit: number
): Promise<WeightEntry[]> {
  const rows = await db.getAllAsync<WeightRow>(
    `SELECT ${COLUMNS} FROM weight_entry
     WHERE log_date <= ? AND deleted_at IS NULL
     ORDER BY log_date DESC
     LIMIT ?`,
    [upTo, limit]
  );
  return rows.map(toEntry);
}

/** The very first weight ever logged, used as the starting point. */
export async function getFirstWeight(db: AppDb): Promise<WeightEntry | null> {
  const row = await db.getFirstAsync<WeightRow>(
    `SELECT ${COLUMNS} FROM weight_entry WHERE deleted_at IS NULL ORDER BY log_date LIMIT 1`
  );
  return row ? toEntry(row) : null;
}
