import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before our custom fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * RootLayout - Root layout of Forge Mobile.
 * Configures the clinical backdrop (OLED Black), loads custom design typography fonts asynchronously,
 * and sets up navigation routes.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist': require('../assets/fonts/Geist-ttf/Geist-Regular.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-ttf/Geist-Bold.ttf'),
    'JetBrainsMono': require('../assets/fonts/JetBrainsMono-ttf/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('../assets/fonts/JetBrainsMono-ttf/JetBrainsMono-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vessel" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
      </Stack>
    </View>
  );
}
