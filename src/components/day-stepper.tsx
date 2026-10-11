import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { IconButton } from './icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { addDays, dayTitle, shortDate, type LogDate } from '@/lib/day';

export type DayStepperProps = {
  label: string;
  value: LogDate;
  today: LogDate;
  onChange: (date: LogDate) => void;
};

/** Picks a day by stepping back and forward. Future days cannot be chosen. */
export function DayStepper({ label, value, today, onChange }: DayStepperProps) {
  const title = dayTitle(value, today);
  const text = title === 'Today' || title === 'Yesterday' ? `${title}, ${shortDate(value)}` : shortDate(value);

  return (
    <View style={styles.field}>
      <AppText type="caption" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.row}>
        <IconButton
          icon={ChevronLeftIcon}
          label="Previous day"
          tone="quiet"
          size={44}
          onPress={() => onChange(addDays(value, -1))}
        />
        <AppText style={styles.value}>{text}</AppText>
        <IconButton
          icon={ChevronRightIcon}
          label="Next day"
          tone="quiet"
          size={44}
          disabled={value >= today}
          onPress={() => onChange(addDays(value, 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.semiBold,
  },
  row: {
    height: 52,
    borderRadius: Radius.field,
    backgroundColor: Colors.ground,
    paddingHorizontal: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: Fonts.semiBold,
  },
});
