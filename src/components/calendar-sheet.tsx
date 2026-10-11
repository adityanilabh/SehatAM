import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { IconButton } from './icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Sheet } from './sheet';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { getFoodCountsByDay } from '@/db/food';
import { useDbQuery } from '@/db/provider';
import {
  addMonths,
  firstDayOf,
  lastDayOf,
  monthGrid,
  monthOf,
  monthTitle,
  WEEKDAY_INITIALS,
} from '@/lib/calendar';
import { longDate, type LogDate } from '@/lib/day';

export type CalendarSheetProps = {
  /** The day currently shown, highlighted in the grid. */
  value: LogDate;
  today: LogDate;
  onSelect: (date: LogDate) => void;
  onClose: () => void;
};

/** A month calendar for jumping to any past day. Days with food logged carry a dot. */
export function CalendarSheet({ value, today, onSelect, onClose }: CalendarSheetProps) {
  const [month, setMonth] = useState(monthOf(value));
  const counts = useDbQuery(`calendar:${month}`, (db) =>
    getFoodCountsByDay(db, firstDayOf(month), lastDayOf(month))
  );
  const isCurrentMonth = month >= monthOf(today);

  return (
    <Sheet visible title="Pick a date" onClose={onClose}>
      <View style={styles.monthRow}>
        <IconButton
          icon={ChevronLeftIcon}
          label="Previous month"
          tone="quiet"
          size={44}
          onPress={() => setMonth(addMonths(month, -1))}
        />
        <AppText type="heading" aria-live="polite">
          {monthTitle(month)}
        </AppText>
        <IconButton
          icon={ChevronRightIcon}
          label="Next month"
          tone="quiet"
          size={44}
          disabled={isCurrentMonth}
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.week}>
          {WEEKDAY_INITIALS.map((initial, index) => (
            <View key={index} style={styles.cell}>
              <AppText type="label">{initial}</AppText>
            </View>
          ))}
        </View>
        {monthGrid(month).map((week, row) => (
          <View key={row} style={styles.week}>
            {week.map((date, column) => {
              if (!date) return <View key={column} style={styles.cell} />;

              const future = date > today;
              const selected = date === value;
              const logged = (counts?.[date] ?? 0) > 0;
              return (
                <Pressable
                  key={date}
                  role="button"
                  aria-label={`${longDate(date)}${logged ? ', food logged' : ''}`}
                  aria-selected={selected}
                  disabled={future}
                  onPress={() => onSelect(date)}
                  style={styles.cell}>
                  <View
                    style={[
                      styles.day,
                      date === today && styles.dayToday,
                      selected && styles.daySelected,
                    ]}>
                    <AppText
                      style={[
                        styles.dayText,
                        future && styles.dayTextFuture,
                        selected && styles.dayTextSelected,
                      ]}>
                      {Number(date.slice(8))}
                    </AppText>
                    <View
                      style={[
                        styles.dot,
                        logged && (selected ? styles.dotSelected : styles.dotLogged),
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <AppText type="caption" style={styles.legend}>
        A dot marks days with food logged.
      </AppText>
      <Button label="Go to today" tone="outline" onPress={() => onSelect(today)} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    gap: Spacing.half,
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderColor: Colors.accent,
  },
  daySelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  dayTextFuture: {
    color: Colors.border,
  },
  dayTextSelected: {
    color: Colors.onAccent,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotLogged: {
    backgroundColor: Colors.accent,
  },
  dotSelected: {
    backgroundColor: Colors.onAccent,
  },
  legend: {
    textAlign: 'center',
  },
});
