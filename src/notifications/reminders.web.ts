import { type ReminderSettings } from '@/lib/reminders';

/**
 * Reminders are not offered in the browser: a web page cannot reliably show a
 * notification at a set time once its tab is closed.
 */

export const remindersSupported = false;

/** Shown in Settings when reminders cannot be offered. */
export const remindersUnavailable = {
  label: 'Available in the Android app',
  hint: 'A browser cannot show reminders once its tab is closed',
};

export async function ensureReminderPermission(): Promise<boolean> {
  return false;
}

export async function syncReminders(_settings: ReminderSettings): Promise<void> {}
