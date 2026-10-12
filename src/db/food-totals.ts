import { type AppDb } from './database';
import { type CalorieSource } from './food';

import { type LogDate } from '@/lib/day';

/** Sets only the calories of an item, leaving everything else as it is. */
export async function setFoodCalories(
  db: AppDb,
  id: string,
  calories: number,
  source: CalorieSource,
  now = new Date()
): Promise<void> {
  await db.runAsync(
    `UPDATE food_entry SET calories = ?, calorie_source = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [Math.round(calories), source, now.toISOString(), id]
  );
}

export type DayTotal = {
  items: number;
  /** Calories of the items that have a figure. */
  kcal: number;
  /** How many items have no calorie figure yet. */
  missing: number;
};

/** Item count and calories per day between two dates, inclusive. Empty days are absent. */
export async function getDayTotals(
  db: AppDb,
  from: LogDate,
  to: LogDate
): Promise<Record<LogDate, DayTotal>> {
  const rows = await db.getAllAsync<{
    log_date: string;
    items: number;
    kcal: number | null;
    missing: number;
  }>(
    `SELECT log_date,
            COUNT(*) AS items,
            SUM(calories) AS kcal,
            SUM(CASE WHEN calories IS NULL THEN 1 ELSE 0 END) AS missing
     FROM food_entry
     WHERE log_date BETWEEN ? AND ? AND deleted_at IS NULL
     GROUP BY log_date`,
    [from, to]
  );
  return Object.fromEntries(
    rows.map((row) => [
      row.log_date,
      { items: row.items, kcal: Math.round(row.kcal ?? 0), missing: row.missing },
    ])
  );
}

/**
 * Foods logged before that contain the typed text, most recent first, for
 * suggesting while the user types. Each distinct text appears once.
 */
export async function getFoodSuggestions(db: AppDb, typed: string, limit = 5): Promise<string[]> {
  const text = typed.trim();
  if (text.length < 2) return [];
  // LIKE treats % and _ as wildcards, so they are escaped with "!".
  const pattern = `%${text.replace(/[!%_]/g, (character) => `!${character}`)}%`;

  const rows = await db.getAllAsync<{ food_text: string }>(
    `SELECT food_text FROM food_entry
     WHERE deleted_at IS NULL AND food_text LIKE ? ESCAPE '!'
     GROUP BY LOWER(food_text)
     ORDER BY MAX(created_at) DESC
     LIMIT ?`,
    [pattern, limit + 1]
  );
  return rows
    .map((row) => row.food_text)
    .filter((food) => food.toLowerCase() !== text.toLowerCase())
    .slice(0, limit);
}
