import { useEffect } from 'react';

import { syncReminders } from './reminders';

import { useDb } from '@/db/provider';

/**
 * Keeps the phone's scheduled reminders in step with the settings: on app start,
 * and whenever a reminder is switched or its time changes (including after an
 * import or "delete all data"). Draws nothing.
 */
export function ReminderSync() {
  const { settings } = useDb();
  const { foodReminderEnabled, foodReminderTime, weightReminderEnabled, weightReminderTime } =
    settings;

  useEffect(() => {
    syncReminders({
      foodReminderEnabled,
      foodReminderTime,
      weightReminderEnabled,
      weightReminderTime,
    }).catch((error) => console.warn('Could not update reminders', error));
  }, [foodReminderEnabled, foodReminderTime, weightReminderEnabled, weightReminderTime]);

  return null;
}
