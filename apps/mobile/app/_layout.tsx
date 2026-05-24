import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </View>
  );
}
