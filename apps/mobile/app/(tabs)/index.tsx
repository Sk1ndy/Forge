import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { loadLatestBlueprint, createWorkoutSession } from '../../src/lib/supabase';
import { WeeklyBlueprint, PlannedExercise } from '@forge/shared';

export default function TodayScreen() {
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<WeeklyBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayPlan, setDayPlan] = useState<PlannedExercise[]>([]);
  const [todayName, setTodayName] = useState<string>('');

  useEffect(() => {
    async function init() {
      const result = await loadLatestBlueprint();
      if (result) {
        setBlueprint(result.blueprint);
        
        // Trouver le jour actuel (Lundi, Mardi, etc.)
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const currentDay = days[new Date().getDay()];
        setTodayName(currentDay);
        
        // @ts-ignore - Indexing WeeklyBlueprint with string
        const plan = result.blueprint[currentDay] || [];
        setDayPlan(plan);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleStartSession = async () => {
    // Créer une session en BDD
    const sessionId = await createWorkoutSession();
    if (sessionId) {
      router.push(`/session/${sessionId}?day=${todayName}`);
    } else {
      alert("Erreur lors de la création de la session. Mode hors-ligne activé.");
      router.push(`/session/offline?day=${todayName}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aujourd'hui</Text>
        <Text style={styles.subtitle}>{todayName}, {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.content}>
        {dayPlan.length > 0 ? (
          <View style={styles.sessionCard}>
            <Text style={styles.cardTitle}>Séance du jour</Text>
            <Text style={styles.cardDesc}>{dayPlan.length} Exercices programmés</Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.startBtn,
                pressed && styles.startBtnPressed
              ]}
              onPress={handleStartSession}
            >
              <Text style={styles.startBtnText}>DÉMARRER LA SESSION</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Jour de repos.</Text>
            {!blueprint && (
              <Text style={[styles.emptyText, { fontSize: 14, marginTop: 10 }]}>
                (Aucun Blueprint trouvé)
              </Text>
            )}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  sessionCard: {
    backgroundColor: '#18181b', // DA: zinc-900
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a', // DA: zinc-800
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 32,
  },
  startBtn: {
    backgroundColor: '#3b82f6', // DA: blue-500
    width: '100%',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startBtnPressed: {
    backgroundColor: '#2563eb', // DA: blue-600
    transform: [{ scale: 0.98 }],
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 18,
    fontWeight: '600',
  }
});
