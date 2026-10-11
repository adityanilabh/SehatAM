import { type AppDb } from './database';

import { type LogDate } from '@/lib/day';
import { newId } from '@/lib/id';

export type FoodEntry = {
  id: string;
  logDate: LogDate;
  /** `HH:MM`, or null when no time was given. */
  eatenAt: string | null;
  foodText: string;
  quantity: string | null;
  /** Filled in from phase 2 onward. */
  calories: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FoodInput = {
  logDate: LogDate;
  foodText: string;
  eatenAt?: string | null;
  quantity?: string | null;
};

type FoodRow = {
  id: string;
  log_date: string;
  eaten_at: string | null;
  food_text: string;
  quantity: string | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'id, log_date, eaten_at, food_text, quantity, calories, created_at, updated_at';

function toEntry(row: FoodRow): FoodEntry {
  return {
    id: row.id,
    logDate: row.log_date,
    eatenAt: row.eaten_at,
    foodText: row.food_text,
    quantity: row.quantity,
    calories: row.calories,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clean(input: FoodInput) {
  const foodText = input.foodText.trim();
  if (!foodText) {
    throw new Error('Food cannot be empty.');
  }
  return {
    logDate: input.logDate,
    foodText,
    eatenAt: input.eatenAt?.trim() || null,
    quantity: input.quantity?.trim() || null,
  };
}

export async function addFood(db: AppDb, input: FoodInput, now = new Date()): Promise<FoodEntry> {
  const { logDate, foodText, eatenAt, quantity } = clean(input);
  const id = newId();
  const stamp = now.toISOString();

  await db.runAsync(
    `INSERT INTO food_entry (id, log_date, eaten_at, food_text, quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, logDate, eatenAt, foodText, quantity, stamp, stamp]
  );

  return {
    id,
    logDate,
    eatenAt,
    foodText,
    quantity,
    calories: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export async function updateFood(
  db: AppDb,
  id: string,
  input: FoodInput,
  now = new Date()
): Promise<void> {
  const { logDate, foodText, eatenAt, quantity } = clean(input);

  await db.runAsync(
    `UPDATE food_entry
     SET log_date = ?, eaten_at = ?, food_text = ?, quantity = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [logDate, eatenAt, foodText, quantity, now.toISOString(), id]
  );
}

export async function deleteFood(db: AppDb, id: string, now = new Date()): Promise<void> {
  const stamp = now.toISOString();
  await db.runAsync(
    'UPDATE food_entry SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    [stamp, stamp, id]
  );
}

/** A day's items: those with a time first, in time order, then the rest as added. */
export async function getFoodForDay(db: AppDb, logDate: LogDate): Promise<FoodEntry[]> {
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${COLUMNS} FROM food_entry
     WHERE log_date = ? AND deleted_at IS NULL
     ORDER BY eaten_at IS NULL, eaten_at, created_at`,
    [logDate]
  );
  return rows.map(toEntry);
}

/** Number of items per day between two dates, inclusive. Days with none are absent. */
export async function getFoodCountsByDay(
  db: AppDb,
  from: LogDate,
  to: LogDate
): Promise<Record<LogDate, number>> {
  const rows = await db.getAllAsync<{ log_date: string; items: number }>(
    `SELECT log_date, COUNT(*) AS items FROM food_entry
     WHERE log_date BETWEEN ? AND ? AND deleted_at IS NULL
     GROUP BY log_date`,
    [from, to]
  );
  return Object.fromEntries(rows.map((row) => [row.log_date, row.items]));
}

/** Days up to `upTo` that have at least one item, newest first. Used for the streak. */
export async function getLoggedDates(db: AppDb, upTo: LogDate, limit = 400): Promise<LogDate[]> {
  const rows = await db.getAllAsync<{ log_date: string }>(
    `SELECT DISTINCT log_date FROM food_entry
     WHERE log_date <= ? AND deleted_at IS NULL
     ORDER BY log_date DESC
     LIMIT ?`,
    [upTo, limit]
  );
  return rows.map((row) => row.log_date);
}
