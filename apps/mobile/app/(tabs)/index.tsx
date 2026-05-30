import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../src/services/auth.service';
import * as Haptics from 'expo-haptics';

export default function CockpitScreen() {
  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await AuthService.logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FORGE COCKPIT</Text>
        <Text style={styles.subtitle}>PRÊT POUR LE DÉVELOPPEMENT BIOMÉCANIQUE</Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleLogout} 
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    color: '#a1a1aa',
    letterSpacing: 1.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 40,
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  }
});
