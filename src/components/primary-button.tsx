import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from './app-text';

import { Colors, Fonts, Radius } from '@/constants/theme';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
};

export function PrimaryButton({ label, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      {...rest}>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: Fonts.semiBold,
    color: Colors.onAccent,
  },
});
