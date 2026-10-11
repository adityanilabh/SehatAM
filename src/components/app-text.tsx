import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type AppTextProps = TextProps & {
  type?: 'title' | 'heading' | 'body' | 'caption' | 'label';
  color?: keyof typeof Colors;
};

export function AppText({ style, type = 'body', color, ...rest }: AppTextProps) {
  return <Text style={[styles[type], color && { color: Colors[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.ink,
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.ink,
  },
  body: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ink,
  },
  caption: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.muted,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.muted,
  },
});
