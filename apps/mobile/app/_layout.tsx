import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { syncAll } from '../src/lib/supabase';

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

  useEffect(() => {
    // Initial sync of offline logs and user profile on app launch
    syncAll().catch((err) => {
      console.warn('RootLayout: Failed to perform initial sync', err);
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000000' },
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="vessel" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
