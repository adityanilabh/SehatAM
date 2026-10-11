import { type ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './app-text';

import { Colors, MaxContentWidth, Spacing, TabBar } from '@/constants/theme';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

export type ScreenProps = {
  /** The page heading. Ignored when `header` is given. */
  title?: string;
  /** Small line shown above the title. */
  eyebrow?: string;
  /** Shown to the right of the title. */
  headerRight?: ReactNode;
  /** Replaces the whole heading row. */
  header?: ReactNode;
  /** Stays pinned above the tab bar, and above the keyboard when it is open. */
  footer?: ReactNode;
  /** Enables pull-to-refresh on phones, and runs when the page is pulled down. */
  onRefresh?: () => void;
  children?: ReactNode;
};

/** Page wrapper: ground colour, safe area, header, and room for the floating tab bar. */
export function Screen({
  title,
  eyebrow,
  headerRight,
  header,
  footer,
  onRefresh,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  // The tab bar floats over the page, so leave room for it. The keyboard covers
  // the tab bar, so that room is given back while typing.
  const bottomRoom = keyboardVisible
    ? Spacing.two
    : TabBar.height + TabBar.margin * 2 + insets.bottom;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              // The refresh is instant, so the spinner never needs to stay.
              <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Colors.accent} />
            ) : undefined
          }>
          <View style={styles.column}>
            {header ?? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {eyebrow ? <AppText type="caption">{eyebrow}</AppText> : null}
                  <AppText type="title" accessibilityRole="header">
                    {title}
                  </AppText>
                </View>
                {headerRight}
              </View>
            )}
            {children}
          </View>
        </ScrollView>
        {footer ? (
          <View style={styles.footer}>
            <View style={styles.footerColumn}>{footer}</View>
          </View>
        ) : null}
        <View style={{ height: bottomRoom }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: TabBar.margin,
  },
  footerColumn: {
    width: '100%',
    maxWidth: MaxContentWidth - TabBar.margin * 2,
  },
});
