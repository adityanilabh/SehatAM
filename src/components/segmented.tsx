import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';

import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';

export type SegmentedProps<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Read out by screen readers to say what is being chosen. */
  label: string;
};

/** A small either/or switch, such as "7 days / 25 days". */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  return (
    <View role="radiogroup" aria-label={label} style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.optionSelected]}>
            <AppText style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    boxShadow: Shadows.card,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: Colors.accent,
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
