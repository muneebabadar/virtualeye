import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';


import { AccessibilityProvider } from '@/contexts/AccessibilityContext'; // NEW


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AccessibilityProvider> {/* NEW: Wrap entire app */}

      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ headerShown: false }} />
          <Stack.Screen name="object-navigation" options={{ headerShown: false }} />
          <Stack.Screen name="color-identification" options={{ headerShown: false }} />
          <Stack.Screen name="currency-reader" options={{ headerShown: false }} />
          <Stack.Screen name="person-registration" options={{ headerShown: false }} />
          <Stack.Screen name="person-capture" options={{ headerShown: false }} />
          <Stack.Screen name="person-name" options={{ headerShown: false }} />
          <Stack.Screen name="person-review" options={{ headerShown: false }} />

          <Stack.Screen name="features" options={{ headerShown: false }} />


          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </AccessibilityProvider>
  );
}
