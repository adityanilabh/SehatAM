import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';

import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { type FoodEntry } from '@/db/food';

export type FoodRowProps = {
  entry: FoodEntry;
  onPress: () => void;
};

/** One food item as a card: time chip, what was eaten, and the quantity if given. */
export function FoodRow({ entry, onPress }: FoodRowProps) {
  const timed = entry.eatenAt !== null;

  return (
    <Pressable
      role="button"
      aria-label={`Edit ${entry.foodText}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.chip, !timed && styles.chipQuiet]}>
        <AppText style={[styles.chipText, !timed && styles.chipTextQuiet]}>
          {entry.eatenAt ?? 'No time'}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText style={styles.food} numberOfLines={2}>
          {entry.foodText}
        </AppText>
        {entry.quantity ? (
          <AppText type="caption" numberOfLines={1}>
            {entry.quantity}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.row,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: Shadows.card,
  },
  pressed: {
    opacity: 0.7,
  },
  chip: {
    width: 56,
    height: 36,
    borderRadius: Radius.small,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipQuiet: {
    backgroundColor: Colors.ground,
  },
  chipText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.accent,
  },
  chipTextQuiet: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.muted,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  food: {
    fontFamily: Fonts.semiBold,
  },
});
