import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { type ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './app-text';
import { FoodIcon, HomeIcon, SettingsIcon, WeightIcon, type TabIconProps } from './tab-icons';

import { Colors, Fonts, MaxContentWidth, Radius, Shadows, TabBar } from '@/constants/theme';

/** The floating four-tab bar from the mockups, shared by Android and web. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <FloatingTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={HomeIcon} label="Home" />
          </TabTrigger>
          <TabTrigger name="food" href="/food" asChild>
            <TabButton icon={FoodIcon} label="Food" />
          </TabTrigger>
          <TabTrigger name="weight" href="/weight" asChild>
            <TabButton icon={WeightIcon} label="Weight" />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon={SettingsIcon} label="Settings" />
          </TabTrigger>
        </FloatingTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: ComponentType<TabIconProps>;
  label: string;
};

function TabButton({ icon: Icon, label, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? Colors.accent : Colors.muted;

  return (
    <Pressable
      {...props}
      role="tab"
      aria-selected={!!isFocused}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Icon color={color} />
      <AppText type="label" style={[{ color }, isFocused && styles.labelFocused]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FloatingTabList({ children, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      pointerEvents="box-none"
      style={[styles.tabListContainer, { bottom: TabBar.margin + insets.bottom }]}>
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: TabBar.margin,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth - TabBar.margin * 2,
    height: TabBar.height,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: Shadows.raised,
  },
  tabButton: {
    width: 72,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  labelFocused: {
    fontFamily: Fonts.bold,
  },
});
