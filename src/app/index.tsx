import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ChevronRightIcon } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { getFoodCountsByDay, getFoodForDay, getLoggedDates } from '@/db/food';
import { useDb, useDbQuery } from '@/db/provider';
import { getFirstWeight, getRecentWeights } from '@/db/weight';
import { useToday } from '@/hooks/use-today';
import { barHeights, spreadBarHeights } from '@/lib/chart';
import { addDays, dateRange, longDate, shortDate, weekdayInitial } from '@/lib/day';
import { greetingFor } from '@/lib/greeting';
import { currentStreak } from '@/lib/streak';
import { summariseWeights } from '@/lib/weight-stats';
import { formatWeight } from '@/lib/weight-unit';

const WEEK_BAR_HEIGHT = 44;

export default function HomeScreen() {
  const router = useRouter();
  const { weightUnit: unit, targetWeightKg } = useDb().settings;
  const today = useToday();
  const weekStart = addDays(today, -6);

  const data = useDbQuery(`home:${today}`, async (db) => ({
    todayItems: await getFoodForDay(db, today),
    weekCounts: await getFoodCountsByDay(db, weekStart, today),
    loggedDates: await getLoggedDates(db, today),
    // Newest first.
    weights: await getRecentWeights(db, today, 7),
    firstWeight: await getFirstWeight(db),
  }));

  const todayItems = data?.todayItems ?? [];
  const streak = data ? currentStreak(data.loggedDates, today) : 0;

  const week = dateRange(weekStart, today);
  const counts = week.map((date) => data?.weekCounts[date] ?? 0);
  const weekHeights = barHeights(counts, WEEK_BAR_HEIGHT);
  const activeDays = counts.filter((count) => count > 0);
  const average =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, count) => sum + count, 0) / activeDays.length)
      : null;

  const weights = [...(data?.weights ?? [])].reverse();
  const latestWeight = weights[weights.length - 1] ?? null;
  const weekWeights = weights.filter((entry) => entry.logDate >= weekStart);
  const weekChange =
    weekWeights.length > 1
      ? latestWeight!.weightKg - weekWeights[0].weightKg
      : null;
  const weekChangeText = weekChange === null ? '0.0' : formatWeight(Math.abs(weekChange), unit);
  const target = summariseWeights(latestWeight ? [latestWeight] : [], data?.firstWeight ?? null, targetWeightKg);
  // With a target set, the card says how far there is to go; otherwise the week's change.
  const weightNote =
    target.toGo !== null
      ? target.reached
        ? 'Target reached'
        : `${formatWeight(target.toGo, unit)} ${unit} to target`
      : weekChange !== null && weekChangeText !== '0.0'
        ? `${weekChange < 0 ? 'Down' : 'Up'} ${weekChangeText} ${unit} this week`
        : latestWeight
          ? `Last logged ${shortDate(latestWeight.logDate)}`
          : 'Nothing logged yet';
  const weightHeights = spreadBarHeights(
    weights.map((entry) => entry.weightKg),
    40,
    18
  );

  // Most recently eaten first; items with no time come after the timed ones.
  const recentItems = [...todayItems].reverse().slice(0, 3);

  return (
    <Screen
      title={greetingFor(new Date().getHours())}
      eyebrow={longDate(today)}
>
      <Pressable
        role="link"
        aria-label={`${todayItems.length} items logged today. Open food log`}
        onPress={() => router.navigate('/food')}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
        <View style={styles.heroText}>
          <AppText style={styles.heroLabel}>Logged today</AppText>
          <View style={styles.heroCountRow}>
            <AppText style={styles.heroCount}>{todayItems.length}</AppText>
            <AppText style={styles.heroUnit}>{todayItems.length === 1 ? 'item' : 'items'}</AppText>
          </View>
          <View style={styles.heroLink}>
            <AppText style={styles.heroLinkText}>Open food log</AppText>
            <ChevronRightIcon color={Colors.onAccent} size={16} />
          </View>
        </View>
        <View style={styles.streak}>
          <AppText style={styles.streakCount}>{streak}</AppText>
          <AppText style={styles.streakLabel}>day streak</AppText>
        </View>
      </Pressable>

      <View style={styles.pair}>
        <Pressable
          role="link"
          aria-label="Open weight"
          onPress={() => router.navigate('/weight')}
          style={({ pressed }) => [styles.half, pressed && styles.pressed]}>
          <Card style={styles.small}>
            <View style={styles.smallHead}>
              <AppText style={styles.smallTitle}>Weight</AppText>
              <AppText type="label" numberOfLines={1}>
                {weightNote}
              </AppText>
            </View>
            <View style={styles.weightFoot}>
              <View style={styles.weightBars}>
                {weightHeights.map((height, index) => (
                  <View
                    key={weights[index].id}
                    style={[
                      styles.weightBar,
                      { height },
                      index === weights.length - 1 && styles.barActive,
                    ]}
                  />
                ))}
              </View>
              {latestWeight ? (
                <View style={styles.weightValue}>
                  <AppText style={styles.weightNumber}>
                    {formatWeight(latestWeight.weightKg, unit)}
                  </AppText>
                  <AppText type="label">{unit}</AppText>
                </View>
              ) : (
                <AppText style={styles.weightNumber}>—</AppText>
              )}
            </View>
          </Card>
        </Pressable>

        <View style={styles.half}>
          <Card style={styles.small}>
            <View style={styles.smallHead}>
              <AppText style={styles.smallTitle}>This week</AppText>
              <AppText type="label" numberOfLines={1}>
                {average === null ? 'Nothing logged yet' : `Avg ${average} ${average === 1 ? 'item' : 'items'} a day`}
              </AppText>
            </View>
            <View
              style={styles.weekBars}
              role="img"
              aria-label={`Items logged on each of the last 7 days: ${counts.join(', ')}`}>
              {week.map((date, index) => (
                <View key={date} style={styles.weekColumn}>
                  <View
                    style={[
                      styles.weekBar,
                      { height: Math.max(weekHeights[index], 3) },
                      weekHeights[index] === 0 && styles.barEmpty,
                      date === today && weekHeights[index] > 0 && styles.barActive,
                    ]}
                  />
                  <AppText type="label" style={date === today ? styles.weekToday : undefined}>
                    {weekdayInitial(date)}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <AppText type="heading" accessibilityRole="header">
          Eaten today
        </AppText>
        <Pressable role="link" onPress={() => router.navigate('/food')} style={styles.seeAll}>
          <AppText style={styles.seeAllText}>See all</AppText>
        </Pressable>
      </View>

      <Card style={styles.list}>
        {recentItems.length === 0 ? (
          <AppText type="caption" style={styles.listEmpty}>
            Nothing logged yet today.
          </AppText>
        ) : (
          recentItems.map((entry, index) => (
            <View
              key={entry.id}
              style={[styles.row, index < recentItems.length - 1 && styles.rowDivider]}>
              <AppText type="caption" style={styles.rowTime}>
                {entry.eatenAt ?? '—'}
              </AppText>
              <AppText style={styles.rowFood} numberOfLines={1}>
                {entry.foodText}
              </AppText>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  hero: {
    minHeight: 168,
    borderRadius: Radius.hero,
    backgroundColor: Colors.accent,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: Shadows.accent,
  },
  heroText: {
    gap: 6,
  },
  heroLabel: {
    fontSize: 14,
    color: Colors.onAccentMuted,
  },
  heroCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroCount: {
    fontFamily: Fonts.bold,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.5,
    color: Colors.onAccent,
  },
  heroUnit: {
    color: Colors.onAccentMuted,
  },
  heroLink: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroLinkText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.onAccent,
  },
  streak: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 30,
    color: Colors.onAccent,
  },
  streakLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.onAccentMuted,
  },
  pair: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  half: {
    flex: 1,
  },
  small: {
    height: 148,
    padding: 16,
    justifyContent: 'space-between',
  },
  smallHead: {
    gap: 2,
  },
  smallTitle: {
    fontFamily: Fonts.bold,
  },
  weightFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  weightBars: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  weightBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: '#C9D2E3',
  },
  weightValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  weightNumber: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  weekBars: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  weekColumn: {
    alignItems: 'center',
    gap: 4,
  },
  weekBar: {
    width: 10,
    borderRadius: 5,
    backgroundColor: '#C9D2E3',
  },
  barEmpty: {
    backgroundColor: Colors.line,
  },
  barActive: {
    backgroundColor: Colors.accent,
  },
  weekToday: {
    fontFamily: Fonts.bold,
    color: Colors.ink,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
  },
  seeAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  list: {
    paddingVertical: 0,
    paddingHorizontal: 16,
    marginTop: -Spacing.two,
  },
  listEmpty: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowTime: {
    width: 44,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  rowFood: {
    flex: 1,
  },
});
