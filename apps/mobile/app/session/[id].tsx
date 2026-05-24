import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlannedExercise, PlannedSetSchema } from '@forge/shared';
import { loadLatestBlueprint, saveExerciseLog, loadExercises } from '../../src/lib/supabase';
import { Stepper } from '../../src/components/Stepper';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';

// -- Types Locaux --
type SetStatus = 'pending' | 'completed' | 'skipped';

interface SetState {
  index: number;
  weight: number;
  reps: number;
  rpe: number;
  status: SetStatus;
  skippedReason?: string;
}

interface ExState {
  exerciseId: string;
  name: string;
  sets: SetState[];
  isExpanded: boolean;
}

export default function SessionScreen() {
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const router = useRouter();

  // État de la session
  const [exercises, setExercises] = useState<ExState[]>([]);
  const [loading, setLoading] = useState(true);
  
  // État du timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);

  useEffect(() => {
    async function initSession() {
      const [bpResult, libResult] = await Promise.all([
        loadLatestBlueprint(),
        loadExercises()
      ]);

      if (bpResult && day) {
        // @ts-ignore
        const plan: PlannedExercise[] = bpResult.blueprint[day] || [];
        
        const initData: ExState[] = plan.map((ex, exIdx) => {
          const exDef = libResult.find(e => e.id === ex.exerciseId);
          return {
            exerciseId: ex.exerciseId,
            name: exDef ? exDef.nom : ex.exerciseId.replace('ex-', '').replace(/-/g, ' ').toUpperCase(),
            isExpanded: exIdx === 0,
            sets: ex.sets.map((s, sIdx) => ({
              index: sIdx,
              weight: s.poids,
              reps: s.reps,
              rpe: s.rpe,
              status: 'pending'
            }))
          };
        });
        setExercises(initData);
      }
      setLoading(false);
    }
    initSession();
  }, [day]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (timeLeft > 0 && isTimerVisible) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerVisible) {
      setIsTimerVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timeLeft, isTimerVisible]);

  const updateSetState = (exIndex: number, setIndex: number, field: keyof SetState, value: any) => {
    const newExs = [...exercises];
    newExs[exIndex].sets[setIndex] = { ...newExs[exIndex].sets[setIndex], [field]: value };
    setExercises(newExs);
  };

  const validateSet = (exIndex: number, setIndex: number) => {
    const currentSet = exercises[exIndex].sets[setIndex];
    
    // Zod Validation
    try {
      PlannedSetSchema.parse({
        series: 1, // Dummy value just for schema compliance if needed, though schema asks for it
        reps: currentSet.reps,
        poids: currentSet.weight,
        rpe: currentSet.rpe,
        active: true
      });
    } catch (e: any) {
      Alert.alert("Erreur de Validation", "Les valeurs entrées ne sont pas valides.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    updateSetState(exIndex, setIndex, 'status', 'completed');
    
    saveExerciseLog({
      session_id: id,
      exercise_id: exercises[exIndex].exerciseId,
      day: day || '',
      set_index: setIndex,
      actual_weight: currentSet.weight,
      actual_reps: currentSet.reps,
      actual_rpe: currentSet.rpe,
      is_completed: true
    });

    setTimeLeft(90); // 1m30 de repos par défaut
    setIsTimerVisible(true);
  };

  const skipSet = (exIndex: number, setIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    updateSetState(exIndex, setIndex, 'status', 'skipped');
    
    saveExerciseLog({
      session_id: id,
      exercise_id: exercises[exIndex].exerciseId,
      day: day || '',
      set_index: setIndex,
      is_completed: false,
      skipped_reason: 'Skipped by user'
    });
  };

  const renderRightActions = (exIndex: number, setIndex: number) => (
    <Pressable 
      style={styles.skipAction} 
      onPress={() => skipSet(exIndex, setIndex)}
    >
      <MaterialCommunityIcons name="cancel" size={24} color="#fff" />
      <Text style={styles.skipText}>Sauter</Text>
    </Pressable>
  );

  const toggleExpand = (exIndex: number) => {
    const newExs = [...exercises];
    newExs[exIndex].isExpanded = !newExs[exIndex].isExpanded;
    setExercises(newExs);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.status !== 'pending').length, 0);
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  if (loading) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{day?.toUpperCase()}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedSets} / {totalSets} Séries Complétées</Text>

        {isTimerVisible && (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer-outline" size={24} color="#10b981" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Pressable onPress={() => setIsTimerVisible(false)} style={styles.timerSkip}>
              <Text style={styles.timerSkipText}>Sauter le repos</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {exercises.map((ex, exIndex) => (
          <View key={exIndex} style={styles.exerciseCard}>
            <Pressable style={styles.exHeader} onPress={() => toggleExpand(exIndex)}>
              <Text style={styles.exTitle}>{ex.name}</Text>
              <MaterialCommunityIcons 
                name={ex.isExpanded ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#71717a" 
              />
            </Pressable>

            {ex.isExpanded && (
              <View style={styles.exBody}>
                {ex.sets.map((set, setIndex) => {
                  const isDone = set.status === 'completed';
                  const isSkipped = set.status === 'skipped';
                  
                  return (
                    <Swipeable 
                      key={setIndex}
                      renderRightActions={() => renderRightActions(exIndex, setIndex)}
                      overshootRight={false}
                    >
                      <View style={[styles.setRow, isDone && styles.setRowDone, isSkipped && styles.setRowSkipped]}>
                        <View style={styles.setInfoBox}>
                          <Text style={styles.setIndex}>Série {setIndex + 1}</Text>
                          {(isDone || isSkipped) && (
                            <MaterialCommunityIcons 
                              name={isDone ? "check-circle" : "close-circle"} 
                              size={16} 
                              color={isDone ? "#10b981" : "#ef4444"} 
                            />
                          )}
                        </View>
                        
                        <View style={styles.inputsRow}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>POIDS</Text>
                            <Stepper 
                              value={set.weight} 
                              onValueChange={(val) => updateSetState(exIndex, setIndex, 'weight', val)}
                              step={2.5}
                              unit="KG"
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>REPS</Text>
                            <Stepper 
                              value={set.reps} 
                              onValueChange={(val) => updateSetState(exIndex, setIndex, 'reps', val)}
                              step={1}
                              min={1}
                            />
                          </View>
                        </View>

                        {set.status === 'pending' && (
                          <Pressable 
                            style={styles.validateBtn}
                            onPress={() => validateSet(exIndex, setIndex)}
                          >
                            <MaterialCommunityIcons name="check" size={24} color="#000" />
                          </Pressable>
                        )}
                      </View>
                    </Swipeable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable 
          style={styles.finishBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/');
          }}
        >
          <Text style={styles.finishBtnText}>TERMINER LA SÉANCE</Text>
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#09090b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981', // Emerald
  },
  progressText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  timerContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  timerText: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '900',
    flex: 1,
  },
  timerSkip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 4,
  },
  timerSkipText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    overflow: 'hidden',
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#18181b',
  },
  exTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
  },
  exBody: {
    padding: 12,
  },
  setRow: {
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 12,
  },
  setRowDone: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  setRowSkipped: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  setInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setIndex: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputsRow: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {},
  inputLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  validateBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  skipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  finishBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  }
});
