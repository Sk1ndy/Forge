import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#71717a',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Aujourd\'hui',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="weight-lifter" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Semaine',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-week" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-line" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
