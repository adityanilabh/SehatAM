import { type AppDb } from './database';

import { estimateCalories, memoryFor, type CalorieEstimate, type MemoryEntry } from '@/lib/calories';

/**
 * The app's memory of calorie figures the user has given, by typing them or by
 * pasting an AI app's reply. It is consulted before the built-in food list, so a
 * food only has to be explained once.
 */

export async function getMemory(db: AppDb): Promise<MemoryEntry[]> {
  const rows = await db.getAllAsync<{ key: string; per: string; kcal: number }>(
    'SELECT key, per, kcal FROM food_memory',
    []
  );
  return rows.map((row) => ({
    key: row.key,
    kcal: row.kcal,
    per: row.per === 'unit' ? 'unit' : 'item',
  }));
}

/** Records that this text came to this many calories. */
export async function rememberCalories(
  db: AppDb,
  text: string,
  kcal: number,
  now = new Date()
): Promise<void> {
  const stamp = now.toISOString();
  for (const entry of memoryFor(text, kcal)) {
    await db.runAsync(
      `INSERT INTO food_memory (key, per, kcal, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (key, per) DO UPDATE SET kcal = excluded.kcal, updated_at = excluded.updated_at`,
      [entry.key, entry.per, entry.kcal, stamp]
    );
  }
}

/** The calorie estimate for some food text, using the memory and then the built-in list. */
export async function estimateFor(db: AppDb, text: string): Promise<CalorieEstimate> {
  return estimateCalories(text, await getMemory(db));
}
