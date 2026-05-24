import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { getUnsyncedLogs } from '../../src/lib/sqlite';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [useLbs, setUseLbs] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email || 'Utilisateur');
      }
      
      // Check offline logs
      try {
        const logs = getUnsyncedLogs();
        setUnsyncedCount(logs.length);
      } catch (e) {
        console.log("No offline logs yet or error.");
      }
    }
    
    loadProfile();
    
    // Refresh interval for sync status
    const interval = setInterval(() => {
      try {
        setUnsyncedCount(getUnsyncedLogs().length);
      } catch (e) {}
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const toggleUnit = () => {
    Haptics.selectionAsync();
    setUseLbs(prev => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RÉGLAGES</Text>
        </View>
        <Text style={styles.title}>PROFIL</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="account-circle" size={24} color="#10b981" />
              <Text style={styles.rowText}>{email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="weight" size={24} color="#71717a" />
                <Text style={styles.rowText}>Affichage en LBS</Text>
              </View>
              <Switch 
                value={useLbs} 
                onValueChange={toggleUnit}
                trackColor={{ false: '#27272a', true: 'rgba(16, 185, 129, 0.5)' }}
                thumbColor={useLbs ? '#10b981' : '#71717a'}
              />
            </View>
            <Text style={styles.noteText}>
              Note: Toutes les données sont sauvegardées en KG dans la base centrale.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ÉTAT DE SYNCHRONISATION</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons 
                name={unsyncedCount === 0 ? "cloud-check" : "cloud-off-outline"} 
                size={24} 
                color={unsyncedCount === 0 ? "#10b981" : "#f59e0b"} 
              />
              <View>
                <Text style={styles.rowText}>
                  {unsyncedCount === 0 ? "En Ligne & Synchronisé" : "Hors Ligne"}
                </Text>
                {unsyncedCount > 0 && (
                  <Text style={styles.syncPendingText}>
                    {unsyncedCount} série(s) en attente de synchronisation
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>DÉCONNEXION</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 12,
    fontStyle: 'italic',
  },
  syncPendingText: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
