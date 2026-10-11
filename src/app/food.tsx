import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CalendarSheet } from '@/components/calendar-sheet';
import { Card } from '@/components/card';
import { FoodRow } from '@/components/food-row';
import { FoodSheet } from '@/components/food-sheet';
import { IconButton } from '@/components/icon-button';
import {
  ArrowUpIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons';
import { MealChips } from '@/components/meal-chips';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { addFood, getFoodForDay, type FoodEntry } from '@/db/food';
import { useDb, useDbQuery } from '@/db/provider';
import { useToday } from '@/hooks/use-today';
import { addDays, clockTime, dayTitle, shortDate, type LogDate } from '@/lib/day';
import { groupByMeal, mealForHour, type Meal } from '@/lib/meals';

export default function FoodScreen() {
  const { db, invalidate } = useDb();
  const today = useToday();
  // null means "follow today", so the screen rolls over when the day changes.
  const [picked, setPicked] = useState<LogDate | null>(null);
  const [draft, setDraft] = useState('');
  // undefined means "not chosen yet": today's items default to the meal for the
  // current time of day, and items for other days default to no meal.
  const [chosenMeal, setChosenMeal] = useState<Meal | null | undefined>(undefined);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const date = picked ?? today;
  const isToday = date === today;
  const meal =
    chosenMeal === undefined ? (isToday ? mealForHour(new Date().getHours()) : null) : chosenMeal;
  const entries = useDbQuery(`food:${date}`, (source) => getFoodForDay(source, date));

  const goTo = (target: LogDate) => {
    setPicked(target >= today ? null : target);
    setChosenMeal(undefined);
  };

  const add = async () => {
    if (draft.trim() === '') return;
    // An item added to today is stamped with the current time; it can be cleared
    // or changed from the edit sheet. Items added to past days get no time.
    await addFood(db, {
      logDate: date,
      foodText: draft,
      meal,
      eatenAt: isToday ? clockTime(new Date()) : null,
    });
    setDraft('');
    invalidate();
  };

  const count = entries?.length ?? 0;

  return (
    <Screen
      // Pulling down returns to today, however far back the screen has gone.
      onRefresh={() => {
        goTo(today);
        invalidate();
      }}
      header={
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeftIcon}
            label="Previous day"
            onPress={() => goTo(addDays(date, -1))}
          />
          <View style={styles.headerText}>
            <AppText type="title" style={styles.title} accessibilityRole="header">
              {dayTitle(date, today)}
            </AppText>
            <AppText type="caption">{shortDate(date)}</AppText>
          </View>
          <IconButton
            icon={ChevronRightIcon}
            label="Next day"
            disabled={isToday}
            onPress={() => goTo(addDays(date, 1))}
          />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <MealChips value={meal} onChange={setChosenMeal} />
          <View style={styles.addBox}>
            <TextInput
              aria-label="What did you eat?"
              placeholder="What did you eat?"
              placeholderTextColor={Colors.muted}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={add}
              submitBehavior="submit"
              returnKeyType="done"
              style={styles.addInput}
            />
            <IconButton
              icon={ArrowUpIcon}
              label="Add item"
              tone="accent"
              size={44}
              disabled={draft.trim() === ''}
              onPress={add}
            />
          </View>
        </View>
      }>
      <View style={styles.dateActions}>
        <Pressable
          role="button"
          onPress={() => setCalendarOpen(true)}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
          <CalendarIcon color={Colors.accent} size={18} />
          <AppText style={styles.pillText}>Pick a date</AppText>
        </Pressable>
        {!isToday ? (
          <Pressable
            role="button"
            onPress={() => goTo(today)}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
            <AppText style={styles.pillText}>Back to today</AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summary}>
        <AppText style={styles.summaryCount}>{count}</AppText>
        <AppText style={styles.summaryLabel}>
          {count === 1 ? 'item logged' : 'items logged'}
        </AppText>
      </View>

      {entries && entries.length === 0 ? (
        <Card style={styles.empty}>
          <AppText type="heading">Nothing logged {isToday ? 'yet' : 'on this day'}</AppText>
          <AppText type="caption" style={styles.emptyText}>
            Type below to add {isToday ? 'your first item' : 'an item'}.
          </AppText>
        </Card>
      ) : null}

      {groupByMeal(entries ?? []).map((section) => (
        <View key={section.meal ?? 'none'} style={styles.section}>
          <AppText type="caption" style={styles.sectionTitle} accessibilityRole="header">
            {section.label}
          </AppText>
          {section.items.map((entry) => (
            <FoodRow key={entry.id} entry={entry} onPress={() => setEditing(entry)} />
          ))}
        </View>
      ))}

      {editing ? (
        <FoodSheet
          key={editing.id}
          entry={editing}
          today={today}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {calendarOpen ? (
        <CalendarSheet
          value={date}
          today={today}
          onSelect={(target) => {
            goTo(target);
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  dateActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: -Spacing.two,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: Shadows.card,
  },
  pillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  summary: {
    borderRadius: Radius.card,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    boxShadow: Shadows.accent,
  },
  summaryCount: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: Colors.onAccent,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.onAccentMuted,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    marginLeft: Spacing.one,
  },
  footer: {
    gap: 10,
  },
  addBox: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    paddingLeft: 20,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: Shadows.raised,
  },
  addInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.ink,
  },
});
