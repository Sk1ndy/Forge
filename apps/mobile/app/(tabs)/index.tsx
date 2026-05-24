import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadLatestBlueprint, loadExercises } from '../../src/lib/supabase';
import { WeeklyBlueprint, PlannedExercise, Exercise } from '@forge/shared';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function TodayScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blueprintName, setBlueprintName] = useState<string>('');
  const [todayName, setTodayName] = useState('');
  const [dayPlan, setDayPlan] = useState<PlannedExercise[]>([]);
  const [pplFocus, setPplFocus] = useState<string>('N/A');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  useEffect(() => {
    async function init() {
      const [bpResult, libResult] = await Promise.all([
        loadLatestBlueprint(),
        loadExercises()
      ]);

      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const currentDay = days[new Date().getDay()];
      setTodayName(currentDay);

      if (bpResult) {
        setBlueprintName(bpResult.name);
        // @ts-ignore
        const plan = bpResult.blueprint[currentDay] || [];
        setDayPlan(plan);

        // Compute PPL focus and Time
        let time = 0;
        const pushCount = { push: 0, pull: 0, legs: 0, core: 0 };
        
        plan.forEach((pEx: PlannedExercise) => {
          const exDef = libResult.find(e => e.id === pEx.exerciseId);
          time += (pEx.sets.length * 3); // Approx 3 mins per set
          if (exDef && exDef.ppl_category !== 'none') {
            pushCount[exDef.ppl_category as keyof typeof pushCount]++;
          }
        });

        setEstimatedTime(time);
        
        const topCategory = Object.entries(pushCount).sort((a, b) => b[1] - a[1])[0];
        if (topCategory[1] > 0) {
          setPplFocus(topCategory[0].toUpperCase());
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const startSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/session/today?day=${todayName}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const isRestDay = dayPlan.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DASHBOARD • AUJOURD'HUI</Text>
        </View>
        <Text style={styles.title}>{todayName.toUpperCase()}</Text>
        <Text style={styles.subtitle}>{blueprintName ? `BLUEPRINT: ${blueprintName}` : 'AUCUN BLUEPRINT ACTIF'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>STATUT DE LA JOURNÉE</Text>
          {isRestDay ? (
            <Text style={styles.statusRest}>REPOS PROGRAMMÉ</Text>
          ) : (
            <Text style={styles.statusTodo}>SÉANCE EN ATTENTE</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#71717a" />
              <Text style={styles.statValue}>{dayPlan.length}</Text>
              <Text style={styles.statSub}>EXERCICES</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#71717a" />
              <Text style={styles.statValue}>{estimatedTime > 0 ? `~${estimatedTime}m` : '-'}</Text>
              <Text style={styles.statSub}>DURÉE</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="target" size={20} color="#71717a" />
              <Text style={styles.statValue}>{pplFocus}</Text>
              <Text style={styles.statSub}>FOCUS</Text>
            </View>
          </View>
        </View>
      </View>

      {!isRestDay && (
        <View style={styles.fabContainer}>
          <Pressable 
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            onPress={startSession}
          >
            <Text style={styles.fabText}>LANCER LA SÉANCE</Text>
            <MaterialCommunityIcons name="play" size={24} color="#000" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 32,
    paddingTop: 48,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 4,
    marginBottom: 24,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 2,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statusCard: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 24,
  },
  statusLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusTodo: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 32,
  },
  statusRest: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  statSub: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  fab: {
    backgroundColor: '#10b981', // Emerald
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  fabPressed: {
    backgroundColor: '#059669', // Darker Emerald
  },
  fabText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  }
});
