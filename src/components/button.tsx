import { type ComponentType } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './app-text';
import { type IconProps } from './icons';

import { Colors, Fonts, Radius } from '@/constants/theme';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** `ink` and `accent` are filled; `outline` and `danger` are bordered. */
  tone?: 'ink' | 'accent' | 'outline' | 'danger';
  icon?: ComponentType<IconProps>;
  style?: StyleProp<ViewStyle>;
};

const LABEL_COLOR = {
  ink: Colors.onAccent,
  accent: Colors.onAccent,
  outline: Colors.accent,
  danger: Colors.danger,
} as const;

export function Button({ label, tone = 'ink', icon: Icon, disabled, style, ...rest }: ButtonProps) {
  const color = LABEL_COLOR[tone];

  return (
    <Pressable
      role="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[tone],
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
      {...rest}>
      {Icon ? <Icon color={color} size={18} /> : null}
      <AppText style={[styles.label, { color }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ink: {
    backgroundColor: Colors.ink,
  },
  accent: {
    backgroundColor: Colors.accent,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  danger: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    fontFamily: Fonts.semiBold,
  },
});
