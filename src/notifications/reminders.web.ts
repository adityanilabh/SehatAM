import { type ReminderSettings } from '@/lib/reminders';

/**
 * Reminders are not offered in the browser: a web page cannot reliably show a
 * notification at a set time once its tab is closed.
 */

export const remindersSupported = false;

export async function ensureReminderPermission(): Promise<boolean> {
  return false;
}

export async function syncReminders(_settings: ReminderSettings): Promise<void> {}
