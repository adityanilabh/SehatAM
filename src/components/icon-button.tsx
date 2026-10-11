import { type ComponentType } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { type IconProps } from './icons';

import { Colors, Radius, Shadows } from '@/constants/theme';

export type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: ComponentType<IconProps>;
  /** Read out by screen readers, since the button has no text. */
  label: string;
  tone?: 'plain' | 'accent' | 'quiet';
  size?: number;
};

export function IconButton({
  icon: Icon,
  label,
  tone = 'plain',
  size = 48,
  disabled,
  ...rest
}: IconButtonProps) {
  const iconColor =
    tone === 'accent' ? Colors.onAccent : disabled ? Colors.border : Colors.ink;

  return (
    <Pressable
      role="button"
      aria-label={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[tone],
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
      {...rest}>
      <Icon color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plain: {
    backgroundColor: Colors.card,
    boxShadow: Shadows.card,
  },
  accent: {
    backgroundColor: Colors.accent,
  },
  quiet: {
    backgroundColor: Colors.ground,
  },
  pressed: {
    opacity: 0.7,
  },
});
