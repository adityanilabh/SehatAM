import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { REMINDER_IDS, reminderPlan, type ReminderSettings } from '@/lib/reminders';

/**
 * Daily reminders on a phone. They are local notifications: the phone schedules
 * and shows them itself, with no server. The browser version is `reminders.web.ts`.
 */

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'reminders';

/**
 * Loads expo-notifications only where it can run. Inside Expo Go on Android the
 * library throws as soon as it is imported (its push-notification setup was removed
 * from Expo Go), which would take the whole app down, so it is never loaded there.
 * Reminders work in a development or release build.
 */
function loadNotifications(): NotificationsModule | null {
  if (Platform.OS === 'android' && isRunningInExpoGo()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const notifications: NotificationsModule = require('expo-notifications');

    // Show a reminder even if the app happens to be open when it fires.
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notifications;
  } catch (error) {
    console.warn('Reminders are unavailable', error);
    return null;
  }
}

const Notifications = loadNotifications();

export const remindersSupported = Notifications !== null;

/** Shown in Settings when reminders cannot be offered. */
export const remindersUnavailable = {
  label: 'Available in the installed app',
  hint: 'Expo Go cannot show reminders',
};

/**
 * Asks for permission to show notifications if it has not been granted yet.
 * Returns whether reminders can be shown.
 */
export async function ensureReminderPermission(): Promise<boolean> {
  if (!Notifications) return false;

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
  if (!Notifications) return;
  const notifications = Notifications;

  await Promise.all(REMINDER_IDS.map((id) => notifications.cancelScheduledNotificationAsync(id)));

  for (const reminder of reminderPlan(settings)) {
    await notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
}
