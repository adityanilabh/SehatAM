import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { WeightChart } from '@/components/weight-chart';
import { WeightSheet } from '@/components/weight-sheet';
import { FREE_HISTORY_DAYS } from '@/constants/limits';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useDb, useDbQuery } from '@/db/provider';
import { getFirstWeight, getRecentWeights, getWeights, type WeightEntry } from '@/db/weight';
import { useToday } from '@/hooks/use-today';
import { addDays, dayTitle, shortDate } from '@/lib/day';
import { summariseWeights } from '@/lib/weight-stats';
import { formatWeight, formatWeightWithUnit } from '@/lib/weight-unit';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: FREE_HISTORY_DAYS, label: `${FREE_HISTORY_DAYS} days` },
];

type SheetState = { entry: WeightEntry | null } | null;

export default function WeightScreen() {
  const { settings } = useDb();
  const today = useToday();
  const [days, setDays] = useState(FREE_HISTORY_DAYS);
  const [sheet, setSheet] = useState<SheetState>(null);

  const from = addDays(today, -(days - 1));
  const data = useDbQuery(`weight:${from}:${today}`, async (db) => ({
    inRange: await getWeights(db, from, today),
    recent: await getRecentWeights(db, today, 5),
    start: await getFirstWeight(db),
  }));

  const inRange = data?.inRange ?? [];
  const recent = data?.recent ?? [];
  // The headline is the latest weight ever logged, even if it is older than the range.
  const latest = recent[0] ?? null;
  const summary = summariseWeights(
    latest && inRange.length === 0 ? [latest] : inRange,
    data?.start ?? null,
    settings.targetWeightKg
  );
  const unit = settings.weightUnit;
  // A change too small to show at one decimal place is treated as no change.
  const change =
    inRange.length > 1 && summary.change !== null && formatWeight(Math.abs(summary.change), unit) !== '0.0'
      ? summary.change
      : null;

  return (
    <Screen
      title="Weight"
      eyebrow="Optional, log when you like"
      headerRight={
        <Segmented label="Period shown" options={RANGES} value={days} onChange={setDays} />
      }
      footer={
        <Button label="Log weight" icon={PlusIcon} onPress={() => setSheet({ entry: null })} />
      }>
      {data && !latest ? (
        <Card style={styles.empty}>
          <AppText type="heading">Log your first weight</AppText>
          <AppText type="caption" style={styles.centred}>
            Your graph and progress appear here once you add one.
          </AppText>
        </Card>
      ) : null}

      {latest ? (
        <Card style={styles.chartCard}>
          <View style={styles.headline}>
            <View style={styles.headlineValue}>
              <AppText style={styles.big}>{formatWeight(latest.weightKg, unit)}</AppText>
              <AppText type="caption" style={styles.unit}>
                {unit}{' '}
                {dayTitle(latest.logDate, today) === 'Today'
                  ? 'today'
                  : `on ${shortDate(latest.logDate)}`}
              </AppText>
            </View>
            {change !== null ? (
              <View
                style={styles.badge}
                aria-label={`${change < 0 ? 'Down' : 'Up'} ${formatWeightWithUnit(Math.abs(change), unit)} in this period`}>
                {change < 0 ? (
                  <ArrowDownIcon color={Colors.accent} size={14} />
                ) : (
                  <ArrowUpIcon color={Colors.accent} size={14} />
                )}
                <AppText style={styles.badgeText}>
                  {formatWeightWithUnit(Math.abs(change), unit)}
                </AppText>
              </View>
            ) : null}
          </View>
          <WeightChart
            points={inRange.map((entry) => ({ date: entry.logDate, value: entry.weightKg }))}
            from={from}
            to={today}
          />
          {inRange.length === 0 ? (
            <AppText type="caption" style={styles.centred}>
              No weight logged in the last {days} days.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {latest ? (
        <View style={styles.stats}>
          <Stat label="Start" value={data?.start ? formatWeightWithUnit(data.start.weightKg, unit) : '—'}
          />
          <Stat
            label="Target"
            value={
              settings.targetWeightKg
                ? formatWeightWithUnit(settings.targetWeightKg, unit)
                : 'Not set'
            }
          />
          <Stat
            label="To go"
            value={
              summary.toGo === null
                ? '—'
                : summary.reached
                  ? 'Reached'
                  : formatWeightWithUnit(summary.toGo, unit)
            }
          />
        </View>
      ) : null}

      {recent.length > 0 ? (
        <Card style={styles.list}>
          {recent.map((entry, index) => (
            <Pressable
              key={entry.id}
              role="button"
              aria-label={`Edit weight for ${shortDate(entry.logDate)}`}
              onPress={() => setSheet({ entry })}
              style={({ pressed }) => [
                styles.row,
                index < recent.length - 1 && styles.rowDivider,
                pressed && styles.pressed,
              ]}>
              <AppText style={styles.rowDate}>
                {dayTitle(entry.logDate, today) === 'Today'
                  ? `Today, ${shortDate(entry.logDate).slice(4)}`
                  : shortDate(entry.logDate)}
              </AppText>
              <AppText style={styles.rowValue}>{formatWeightWithUnit(entry.weightKg, unit)}</AppText>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {sheet ? (
        <WeightSheet
          key={sheet.entry?.id ?? 'new'}
          entry={sheet.entry}
          today={today}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <AppText type="caption">{label}</AppText>
      <AppText style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.five,
  },
  centred: {
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: Radius.hero,
    gap: Spacing.three,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headlineValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 1,
  },
  big: {
    fontFamily: Fonts.bold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  unit: {
    fontSize: 15,
  },
  badge: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.accent,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    minHeight: 76,
    padding: 14,
    borderRadius: Radius.row,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  list: {
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  pressed: {
    opacity: 0.6,
  },
  rowDate: {
    fontSize: 14,
  },
  rowValue: {
    fontFamily: Fonts.bold,
  },
});
