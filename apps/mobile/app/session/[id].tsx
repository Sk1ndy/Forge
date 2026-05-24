import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlannedExercise } from '@forge/shared';
import { loadLatestBlueprint, saveExerciseLog } from '../../src/lib/supabase';

// -- Types Locaux --
type SetStatus = 'pending' | 'completed' | 'skipped';

interface SetState {
  index: number;
  weight: string;
  reps: string;
  rpe: string;
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
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    async function initSession() {
      const result = await loadLatestBlueprint();
      if (result && day) {
        // @ts-ignore
        const plan: PlannedExercise[] = result.blueprint[day] || [];
        
        const initData: ExState[] = plan.map((ex, exIdx) => ({
          exerciseId: ex.exerciseId,
          name: ex.exerciseId.replace('ex-', '').replace(/-/g, ' ').toUpperCase(), // Basic formatting since we don't have exercisesLib here yet
          isExpanded: exIdx === 0,
          sets: ex.sets.map((s, sIdx) => ({
            index: sIdx,
            weight: s.poids.toString(),
            reps: s.reps.toString(),
            rpe: s.rpe.toString(),
            status: 'pending'
          }))
        }));
        setExercises(initData);
      }
      setLoading(false);
    }
    initSession();
  }, [day]);

  // Gestion du Chrono (Option A : Automatique)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerVisible && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerVisible) {
      setIsTimerVisible(false); // Fin du timer
    }
    return () => clearInterval(interval);
  }, [isTimerVisible, timeLeft]);

  const toggleAccordion = (exIdx: number) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exIdx ? { ...ex, isExpanded: !ex.isExpanded } : ex
    ));
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => {
      const newEx = [...prev];
      newEx[exIdx].sets[setIdx][field] = value;
      return newEx;
    });
  };

  const validateSet = async (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const newEx = [...prev];
      newEx[exIdx].sets[setIdx].status = 'completed';
      return newEx;
    });
    
    // Save to DB
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    await saveExerciseLog({
      session_id: id as string,
      exercise_id: ex.exerciseId,
      day: day as string,
      set_index: setIdx,
      actual_weight: parseFloat(set.weight) || 0,
      actual_reps: parseInt(set.reps) || 0,
      actual_rpe: parseFloat(set.rpe) || 0,
      is_completed: true
    });

    // Déclenchement automatique du Timer
    setTimeLeft(90);
    setIsTimerVisible(true);
  };

  const skipSet = (exIdx: number, setIdx: number) => {
    Alert.alert(
      "Sauter la série",
      "Quelle est la raison principale ?",
      [
        { text: "Fatigue excessive", onPress: () => markSkipped(exIdx, setIdx, "Fatigue") },
        { text: "Douleur / Blessure", onPress: () => markSkipped(exIdx, setIdx, "Blessure") },
        { text: "Manque de temps", onPress: () => markSkipped(exIdx, setIdx, "Temps") },
        { text: "Annuler", style: "cancel" }
      ]
    );
  };

  const markSkipped = async (exIdx: number, setIdx: number, reason: string) => {
    setExercises(prev => {
      const newEx = [...prev];
      newEx[exIdx].sets[setIdx].status = 'skipped';
      newEx[exIdx].sets[setIdx].skippedReason = reason;
      return newEx;
    });

    // Save to DB
    const ex = exercises[exIdx];
    await saveExerciseLog({
      session_id: id as string,
      exercise_id: ex.exerciseId,
      day: day as string,
      set_index: setIdx,
      is_completed: false,
      skipped_reason: reason
    });
  };

  const finishSession = () => {
    Alert.alert("Terminé !", "Séance enregistrée avec succès.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-down" size={32} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>SESSION EN COURS</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
        {exercises.map((ex, exIdx) => (
          <View key={exIdx} style={styles.exerciseCard}>
            {/* Accordion Header */}
            <Pressable 
              style={styles.exHeader} 
              onPress={() => toggleAccordion(exIdx)}
            >
              <Text style={styles.exName}>{ex.name}</Text>
              <MaterialCommunityIcons 
                name={ex.isExpanded ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#71717a" 
              />
            </Pressable>

            {/* Accordion Content (Liste déroulante) */}
            {ex.isExpanded && (
              <View style={styles.exContent}>
                {ex.sets.map((set, setIdx) => (
                  <View key={setIdx} style={styles.setRow}>
                    <View style={styles.setNumberBox}>
                      <Text style={styles.setNumber}>{set.index + 1}</Text>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>KG</Text>
                        <TextInput
                          style={[styles.input, set.status !== 'pending' && styles.inputDisabled]}
                          keyboardType="numeric"
                          value={set.weight}
                          onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                          editable={set.status === 'pending'}
                        />
                      </View>
                      <MaterialCommunityIcons name="close" size={16} color="#3f3f46" style={{ marginTop: 15 }} />
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>REPS</Text>
                        <TextInput
                          style={[styles.input, set.status !== 'pending' && styles.inputDisabled]}
                          keyboardType="numeric"
                          value={set.reps}
                          onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                          editable={set.status === 'pending'}
                        />
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionGroup}>
                      {set.status === 'pending' ? (
                        <>
                          <Pressable style={styles.skipBtn} onPress={() => skipSet(exIdx, setIdx)}>
                            <MaterialCommunityIcons name="debug-step-over" size={24} color="#71717a" />
                          </Pressable>
                          <Pressable style={styles.validateBtn} onPress={() => validateSet(exIdx, setIdx)}>
                            <MaterialCommunityIcons name="check-bold" size={24} color="#fff" />
                          </Pressable>
                        </>
                      ) : set.status === 'completed' ? (
                        <View style={styles.completedBadge}>
                          <MaterialCommunityIcons name="check-circle" size={28} color="#10b981" />
                        </View>
                      ) : (
                        <View style={styles.skippedBadge}>
                          <Text style={styles.skippedText}>{set.skippedReason}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <Pressable style={styles.finishBtn} onPress={finishSession}>
          <Text style={styles.finishBtnText}>TERMINER LA SÉANCE</Text>
        </Pressable>
      </ScrollView>

      {/* Timer Modal (Option A) */}
      <Modal visible={isTimerVisible} animationType="slide" transparent={true}>
        <View style={styles.timerOverlay}>
          <View style={styles.timerBox}>
            <Text style={styles.timerTitle}>TEMPS DE REPOS</Text>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            
            <Pressable 
              style={styles.skipTimerBtn} 
              onPress={() => setIsTimerVisible(false)}
            >
              <Text style={styles.skipTimerText}>PASSER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#3b82f6',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  exerciseCard: {
    backgroundColor: '#09090b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 20,
    overflow: 'hidden',
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#18181b',
  },
  exName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  exContent: {
    padding: 15,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  setNumberBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    color: '#a1a1aa',
    fontWeight: '900',
    fontSize: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#18181b',
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    width: 60,
    height: 50,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  inputDisabled: {
    color: '#52525b',
    borderColor: '#27272a',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    width: 98, // To match width of two buttons + gap
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skippedBadge: {
    width: 98,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450a0a',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  skippedText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  finishBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  finishBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  timerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBox: {
    alignItems: 'center',
  },
  timerTitle: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 20,
  },
  timerText: {
    color: '#fff',
    fontSize: 80,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginBottom: 40,
  },
  skipTimerBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  skipTimerText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
