import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { DbProvider } from '@/db/provider';
import { ReminderSync } from '@/notifications/reminder-sync';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.ground },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  // A font failure should not block the app; it falls back to the system font.
  // The web version never waits: it has no splash screen to hide behind, so it
  // draws at once and the font swaps in when it arrives.
  const ready = fontsLoaded || fontError !== null || Platform.OS === 'web';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <Head>
        <title>SehatAM</title>
      </Head>
      <StatusBar style="dark" />
      <DbProvider>
        <ReminderSync />
        <AppTabs />
      </DbProvider>
    </ThemeProvider>
  );
}
