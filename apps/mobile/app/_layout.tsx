import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'session';
    
    if (!session && inAuthGroup) {
      // Pas connecté, on redirige vers le login
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      // Connecté mais sur la page de login, on redirige vers l'accueil
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="session/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </View>
  );
}
