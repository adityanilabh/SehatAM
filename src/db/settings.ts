import { type AppDb } from './database';

export type Settings = {
  /** Hour (0 to 23) at which a new day begins. Before it, entries count for the day before. */
  dayStartHour: number;
  /** Daily calorie target. Stored now, shown from phase 2 when calories exist. */
  calorieTarget: number | null;
  targetWeightKg: number | null;
  foodReminderEnabled: boolean;
  /** `HH:MM` */
  foodReminderTime: string;
  weightReminderEnabled: boolean;
  /** `HH:MM` */
  weightReminderTime: string;
};

export const DEFAULT_SETTINGS: Settings = {
  dayStartHour: 4,
  calorieTarget: null,
  targetWeightKg: null,
  foodReminderEnabled: false,
  foodReminderTime: '20:00',
  weightReminderEnabled: false,
  weightReminderTime: '07:00',
};

/** Settings are stored as one JSON-encoded value per key. */
export async function getSettings(db: AppDb): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM setting',
    []
  );
  const stored: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value);
    } catch {
      // An unreadable value falls back to the default.
    }
  }
  return normaliseSettings(stored);
}

export async function updateSettings(
  db: AppDb,
  changes: Partial<Settings>,
  now = new Date()
): Promise<void> {
  const stamp = now.toISOString();
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(changes)) {
      if (!(key in DEFAULT_SETTINGS) || value === undefined) continue;
      await db.runAsync(
        `INSERT INTO setting (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, JSON.stringify(value), stamp]
      );
    }
  });
}

const isTime = (value: unknown): value is string =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const positiveOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

/** Fills gaps and rejects malformed values, so stored or imported settings are always usable. */
export function normaliseSettings(raw: Record<string, unknown>): Settings {
  const hour = raw.dayStartHour;
  return {
    dayStartHour:
      typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23
        ? hour
        : DEFAULT_SETTINGS.dayStartHour,
    calorieTarget: positiveOrNull(raw.calorieTarget),
    targetWeightKg: positiveOrNull(raw.targetWeightKg),
    foodReminderEnabled: raw.foodReminderEnabled === true,
    foodReminderTime: isTime(raw.foodReminderTime)
      ? raw.foodReminderTime
      : DEFAULT_SETTINGS.foodReminderTime,
    weightReminderEnabled: raw.weightReminderEnabled === true,
    weightReminderTime: isTime(raw.weightReminderTime)
      ? raw.weightReminderTime
      : DEFAULT_SETTINGS.weightReminderTime,
  };
}
