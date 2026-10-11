import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_IDS, reminderPlan, type ReminderSettings } from '@/lib/reminders';

/**
 * Daily reminders on a phone. They are local notifications: the phone schedules
 * and shows them itself, with no server. The browser version is `reminders.web.ts`.
 */

export const remindersSupported = true;

const CHANNEL_ID = 'reminders';

// Show a reminder even if the app happens to be open when it fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Asks for permission to show notifications if it has not been granted yet.
 * Returns whether reminders can be shown.
 */
export async function ensureReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android only shows its permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Makes the phone's scheduled reminders match the settings. Safe to call repeatedly. */
export async function syncReminders(settings: ReminderSettings): Promise<void> {
  await Promise.all(REMINDER_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  for (const reminder of reminderPlan(settings)) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
}
