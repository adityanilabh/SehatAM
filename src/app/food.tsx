import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AiSheet } from '@/components/ai-sheet';
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
import { getFoodSuggestions } from '@/db/food-totals';
import { estimateFor } from '@/db/memory';
import { useDb, useDbQuery } from '@/db/provider';
import { useToday } from '@/hooks/use-today';
import { addDays, clockTime, dayTitle, shortDate, type LogDate } from '@/lib/day';
import { formatNumber } from '@/lib/format';
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
  const [aiOpen, setAiOpen] = useState(false);

  const date = picked ?? today;
  const isToday = date === today;
  const meal =
    chosenMeal === undefined ? (isToday ? mealForHour(new Date().getHours()) : null) : chosenMeal;
  const entries = useDbQuery(`food:${date}`, (source) => getFoodForDay(source, date));
  // While typing: earlier foods to pick from, and what the calories would come to.
  const typing = useDbQuery(`typing:${draft}`, async (source) => ({
    suggestions: await getFoodSuggestions(source, draft),
    estimate: draft.trim() === '' ? null : await estimateFor(source, draft),
  }));

  const goTo = (target: LogDate) => {
    setPicked(target >= today ? null : target);
    setChosenMeal(undefined);
  };

  const add = async () => {
    if (draft.trim() === '') return;
    // An item added to today is stamped with the current time; it can be cleared
    // or changed from the edit sheet. Items added to past days get no time.
    // Calories come from what the user has taught the app, then the built-in list.
    const estimate = await estimateFor(db, draft);
    await addFood(db, {
      logDate: date,
      foodText: draft,
      meal,
      eatenAt: isToday ? clockTime(new Date()) : null,
      calories: estimate.total,
      calorieSource: estimate.source,
    });
    setDraft('');
    invalidate();
  };

  const count = entries?.length ?? 0;
  const missing = (entries ?? []).filter((entry) => entry.calories === null);
  const totalKcal = (entries ?? []).reduce((sum, entry) => sum + (entry.calories ?? 0), 0);
  const unknownParts = typing?.estimate?.parts.filter((part) => part.kcal === null) ?? [];

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
          {typing && typing.suggestions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestions}>
              {typing.suggestions.map((food) => (
                <Pressable
                  key={food}
                  role="button"
                  aria-label={`Use ${food}`}
                  onPress={() => setDraft(food)}
                  style={styles.suggestion}>
                  <AppText style={styles.suggestionText} numberOfLines={1}>
                    {food}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          {typing?.estimate && typing.estimate.parts.length > 0 ? (
            <AppText type="caption" style={styles.preview} aria-live="polite">
              {typing.estimate.total !== null
                ? `About ${formatNumber(typing.estimate.total)} kcal`
                : `No calories yet for: ${unknownParts.map((part) => part.label).join(', ')}`}
            </AppText>
          ) : null}
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
        <View style={styles.summaryLine}>
          <AppText style={styles.summaryCount}>{formatNumber(totalKcal)}</AppText>
          <AppText style={styles.summaryLabel}>
            kcal from {count} {count === 1 ? 'item' : 'items'}
          </AppText>
        </View>
        {missing.length > 0 ? (
          <AppText style={styles.summaryLabel}>
            {missing.length} {missing.length === 1 ? 'item has' : 'items have'} no calories yet
          </AppText>
        ) : null}
      </View>

      {missing.length > 0 ? (
        <Pressable
          role="button"
          onPress={() => setAiOpen(true)}
          style={({ pressed }) => [styles.pill, styles.aiPill, pressed && styles.pressed]}>
          <AppText style={styles.pillText}>Ask an AI app for the missing calories</AppText>
        </Pressable>
      ) : null}

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

      {aiOpen ? <AiSheet items={missing} onClose={() => setAiOpen(false)} /> : null}

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
    gap: Spacing.one,
    boxShadow: Shadows.accent,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  aiPill: {
    alignSelf: 'center',
    marginTop: -Spacing.two,
  },
  suggestions: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestion: {
    minHeight: 44,
    maxWidth: 240,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
    justifyContent: 'center',
  },
  suggestionText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  preview: {
    marginLeft: Spacing.one,
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
