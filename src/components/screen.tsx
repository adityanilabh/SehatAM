import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from './app-text';

import { Colors, MaxContentWidth, Spacing, TabBar } from '@/constants/theme';

export type ScreenProps = {
  title: string;
  /** Small line shown above the title. */
  eyebrow?: string;
  children?: ReactNode;
};

/** Page wrapper: ground colour, safe area, header, and room for the floating tab bar. */
export function Screen({ title, eyebrow, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            {eyebrow ? <AppText type="caption">{eyebrow}</AppText> : null}
            <AppText type="title" accessibilityRole="header">
              {title}
            </AppText>
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    // Clear the floating tab bar, plus a little breathing room for gesture bars.
    paddingBottom: TabBar.height + TabBar.margin * 3,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    minHeight: 56,
    justifyContent: 'center',
    gap: Spacing.half,
  },
});
