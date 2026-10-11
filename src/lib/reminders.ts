export type ReminderSettings = {
  foodReminderEnabled: boolean;
  foodReminderTime: string;
  weightReminderEnabled: boolean;
  weightReminderTime: string;
};

export type Reminder = {
  /** Stable id, so re-scheduling replaces the old reminder instead of adding another. */
  id: 'food-reminder' | 'weight-reminder';
  hour: number;
  minute: number;
  title: string;
  body: string;
};

export const REMINDER_IDS: Reminder['id'][] = ['food-reminder', 'weight-reminder'];

function at(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/** The daily reminders that should exist for these settings. */
export function reminderPlan(settings: ReminderSettings): Reminder[] {
  const plan: Reminder[] = [];

  if (settings.foodReminderEnabled) {
    plan.push({
      id: 'food-reminder',
      ...at(settings.foodReminderTime),
      title: 'What have you eaten today?',
      body: 'Take a moment to log your food.',
    });
  }
  if (settings.weightReminderEnabled) {
    plan.push({
      id: 'weight-reminder',
      ...at(settings.weightReminderTime),
      title: 'Time to weigh in',
      body: "Log today's weight to keep your graph going.",
    });
  }

  return plan;
}

/** Moves an `HH:MM` time by some minutes, wrapping around midnight. */
export function shiftClockTime(time: string, minutes: number): string {
  const { hour, minute } = at(time);
  const total = (((hour * 60 + minute + minutes) % 1440) + 1440) % 1440;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
