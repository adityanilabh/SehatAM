import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { MEALS, type Meal } from '@/lib/meals';

export type MealChipsProps = {
  value: Meal | null;
  /** Pressing the selected meal clears it, so an item can be left unfiled. */
  onChange: (meal: Meal | null) => void;
  /** Wrap onto several lines instead of scrolling sideways. */
  wrap?: boolean;
};

/** Chooses which meal an item belongs to. */
export function MealChips({ value, onChange, wrap }: MealChipsProps) {
  const chips = MEALS.map((meal) => {
    const selected = meal.id === value;
    return (
      <Pressable
        key={meal.id}
        role="radio"
        aria-checked={selected}
        aria-label={meal.label}
        onPress={() => onChange(selected ? null : meal.id)}
        style={[styles.chip, selected && styles.chipSelected]}>
        <AppText style={[styles.label, selected && styles.labelSelected]}>{meal.label}</AppText>
      </Pressable>
    );
  });

  if (wrap) {
    return (
      <View role="radiogroup" aria-label="Meal" style={[styles.row, styles.wrap]}>
        {chips}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      role="radiogroup"
      aria-label="Meal"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.muted,
  },
  labelSelected: {
    fontFamily: Fonts.bold,
    color: Colors.onAccent,
  },
});
