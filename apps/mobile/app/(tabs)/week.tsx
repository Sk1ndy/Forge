import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadLatestBlueprint, loadExercises } from '../../src/lib/supabase';
import { WeeklyBlueprint, Exercise, PlannedExercise } from '@forge/shared';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WeekScreen() {
  const [blueprint, setBlueprint] = useState<WeeklyBlueprint | null>(null);
  const [exercisesLib, setExercisesLib] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    async function init() {
      const [bpResult, libResult] = await Promise.all([
        loadLatestBlueprint(),
        loadExercises()
      ]);

      if (bpResult) {
        setBlueprint(bpResult.blueprint);
      }
      
      const libMap: Record<string, Exercise> = {};
      libResult.forEach(ex => {
        libMap[ex.id] = ex;
      });
      setExercisesLib(libMap);
      
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!blueprint) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Aucun Blueprint trouvé.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MODULE PLANNING</Text>
        </View>
        <Text style={styles.title}>SEMAINE</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {days.map((day, idx) => {
          const plan = (blueprint as any)[day] as PlannedExercise[] || [];
          const isRest = plan.length === 0;

          return (
            <View key={idx} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                {isRest ? (
                  <View style={styles.restBadge}>
                    <Text style={styles.restBadgeText}>REPOS</Text>
                  </View>
                ) : (
                  <Text style={styles.workoutCount}>{plan.length} EXERCICES</Text>
                )}
              </View>

              {!isRest && (
                <View style={styles.exerciseList}>
                  {plan.map((ex, exIdx) => {
                    const exDetails = exercisesLib[ex.exerciseId];
                    const exName = exDetails ? exDetails.nom : ex.exerciseId;
                    
                    return (
                      <View key={exIdx} style={styles.exerciseRow}>
                        <MaterialCommunityIcons name="circle-medium" size={16} color="#3b82f6" />
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exName}</Text>
                          <Text style={styles.exerciseMeta}>
                            {ex.sets.length} SÉRIES • RPE {ex.sets[0]?.rpe || '-'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#71717a',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#3b82f6',
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
    flex: 1,
    padding: 24,
  },
  dayCard: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  dayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutCount: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  exerciseList: {
    padding: 16,
    gap: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseMeta: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  }
});
