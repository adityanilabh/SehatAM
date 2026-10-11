import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { confirm, notify } from '@/components/confirm';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import {
  ActionRow,
  NumberSetting,
  SettingsGroup,
  SettingRow,
  StepperSetting,
  SwitchSetting,
} from '@/components/setting-rows';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { deleteAllData, exportData, importData, parseBackup } from '@/db/backup';
import { useDb } from '@/db/provider';
import { updateSettings, type Settings } from '@/db/settings';
import { isValidWeight } from '@/db/weight';
import { pickBackupFile, saveBackupFile } from '@/lib/backup-file';
import { friendlyTime, logDateFor } from '@/lib/day';
import { shiftClockTime } from '@/lib/reminders';
import {
  formatWeight,
  parseNumber,
  toKg,
  WEIGHT_UNITS,
  type WeightUnit,
} from '@/lib/weight-unit';
import {
  ensureReminderPermission,
  remindersSupported,
  remindersUnavailable,
} from '@/notifications/reminders';

/** The latest hour the day can be set to start: 11 am. */
const LATEST_DAY_START = 11;

const hourText = (hour: number) => friendlyTime(`${String(hour).padStart(2, '0')}:00`);

function parseCalories(text: string): number | null | undefined {
  if (text.trim() === '') return null;
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 500 && value <= 10000 ? value : undefined;
}

/** Reads a target weight typed in the chosen unit and returns it in kilograms. */
function parseTargetWeight(text: string, unit: WeightUnit): number | null | undefined {
  if (text.trim() === '') return null;
  const typed = parseNumber(text);
  if (typed === null) return undefined;
  const weightKg = Math.round(toKg(typed, unit) * 100) / 100;
  return isValidWeight(weightKg) ? weightKg : undefined;
}

export default function SettingsScreen() {
  const { db, settings, invalidate } = useDb();

  const save = async (changes: Partial<Settings>) => {
    await updateSettings(db, changes);
    invalidate();
  };

  // Switching a reminder on needs the phone's permission to show notifications.
  const setReminder = async (
    key: 'foodReminderEnabled' | 'weightReminderEnabled',
    enabled: boolean
  ) => {
    if (enabled && !(await ensureReminderPermission())) {
      notify(
        'Notifications are off',
        "Allow notifications for this app in your phone's settings, then switch the reminder on again."
      );
      return;
    }
    await save({ [key]: enabled });
  };

  const exportBackup = async () => {
    try {
      const backup = await exportData(db);
      const stamp = logDateFor(new Date(), 0);
      await saveBackupFile(`sehatam-backup-${stamp}.json`, JSON.stringify(backup, null, 2));
    } catch (error) {
      notify('Export failed', String(error));
    }
  };

  const importBackup = async () => {
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      const backup = parseBackup(text);
      const confirmed = await confirm({
        title: 'Import this backup?',
        message: `It holds ${backup.food.length} food items and ${backup.weight.length} weights. They are added to what is already here; nothing is removed.`,
        confirmLabel: 'Import',
      });
      if (!confirmed) return;

      await importData(db, backup);
      invalidate();
      notify('Import finished', 'Your backup has been added.');
    } catch (error) {
      notify('Import failed', error instanceof Error ? error.message : String(error));
    }
  };

  const deleteEverything = async () => {
    const confirmed = await confirm({
      title: 'Delete all data?',
      message:
        'Every food item, weight and setting on this device is removed for good. Export a backup first if you might want it back.',
      confirmLabel: 'Delete everything',
      destructive: true,
    });
    if (!confirmed) return;

    await deleteAllData(db);
    invalidate();
    notify('All data deleted', 'The app is back to how it was when first installed.');
  };

  const { dayStartHour, weightUnit } = settings;

  return (
    <Screen title="Settings">
      <View style={styles.notice}>
        <AppText style={styles.noticeTitle}>Your data stays on this device</AppText>
        <AppText style={styles.noticeText}>
          Nothing is sent anywhere. Export a backup now and then to keep a copy.
        </AppText>
      </View>

      <SettingsGroup title="Goals">
        <NumberSetting
          label="Daily calorie target"
          hint="Used once calorie estimates arrive"
          unit="kcal"
          value={settings.calorieTarget}
          placeholder="None"
          invalidHint="Enter a whole number from 500 to 10000"
          parse={parseCalories}
          onSave={(calorieTarget) => save({ calorieTarget })}
        />
        <NumberSetting
          label="Target weight"
          unit={weightUnit}
          value={
            settings.targetWeightKg === null
              ? null
              : Number(formatWeight(settings.targetWeightKg, weightUnit))
          }
          placeholder="None"
          invalidHint="Enter a weight, such as 70"
          parse={(text) => parseTargetWeight(text, weightUnit)}
          onSave={(targetWeightKg) => save({ targetWeightKg })}
        />
        <SettingRow label="Weight unit">
          <Segmented
            label="Weight unit"
            options={WEIGHT_UNITS}
            value={weightUnit}
            onChange={(next) => save({ weightUnit: next })}
          />
        </SettingRow>
        <StepperSetting
          label="Day starts at"
          hint="Earlier than this counts for the day before"
          text={hourText(dayStartHour)}
          decreaseLabel="Start the day earlier"
          increaseLabel="Start the day later"
          onDecrease={dayStartHour > 0 ? () => save({ dayStartHour: dayStartHour - 1 }) : undefined}
          onIncrease={
            dayStartHour < LATEST_DAY_START
              ? () => save({ dayStartHour: dayStartHour + 1 })
              : undefined
          }
          last
        />
      </SettingsGroup>

      <SettingsGroup title="Reminders">
        {remindersSupported ? (
          <>
            <SwitchSetting
              label="Remind me to log food"
              value={settings.foodReminderEnabled}
              onChange={(enabled) => setReminder('foodReminderEnabled', enabled)}
              last={!settings.foodReminderEnabled}
            />
            {settings.foodReminderEnabled ? (
              <StepperSetting
                label="Food reminder time"
                text={friendlyTime(settings.foodReminderTime)}
                decreaseLabel="Food reminder earlier"
                increaseLabel="Food reminder later"
                onDecrease={() =>
                  save({ foodReminderTime: shiftClockTime(settings.foodReminderTime, -30) })
                }
                onIncrease={() =>
                  save({ foodReminderTime: shiftClockTime(settings.foodReminderTime, 30) })
                }
              />
            ) : null}
            <View style={styles.reminderGap} />
            <SwitchSetting
              label="Remind me to log weight"
              value={settings.weightReminderEnabled}
              onChange={(enabled) => setReminder('weightReminderEnabled', enabled)}
              last={!settings.weightReminderEnabled}
            />
            {settings.weightReminderEnabled ? (
              <StepperSetting
                label="Weight reminder time"
                text={friendlyTime(settings.weightReminderTime)}
                decreaseLabel="Weight reminder earlier"
                increaseLabel="Weight reminder later"
                onDecrease={() =>
                  save({ weightReminderTime: shiftClockTime(settings.weightReminderTime, -30) })
                }
                onIncrease={() =>
                  save({ weightReminderTime: shiftClockTime(settings.weightReminderTime, 30) })
                }
                last
              />
            ) : null}
          </>
        ) : (
          <SettingRow
            label={remindersUnavailable.label}
            hint={remindersUnavailable.hint}
            last
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Data">
        <ActionRow
          label="Export my data"
          hint="Saves a backup file you can keep"
          onPress={exportBackup}
        />
        <ActionRow
          label="Import a backup"
          hint="Adds a backup file to this device"
          onPress={importBackup}
        />
        <ActionRow label="Delete all data" danger onPress={deleteEverything} last />
      </SettingsGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: Radius.hero,
    backgroundColor: Colors.accent,
    padding: Spacing.four,
    gap: Spacing.one,
    boxShadow: Shadows.accent,
  },
  reminderGap: {
    height: 1,
    backgroundColor: Colors.line,
  },
  noticeTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.onAccent,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.onAccentMuted,
  },
});
